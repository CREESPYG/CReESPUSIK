package app.musike.android;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Icon;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import android.util.Log;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Keeps Musike alive while music plays and connects it to the system: the media notification, the lock screen,
 * headphone and Bluetooth buttons, and pausing when headphones are unplugged. The music itself plays in the
 * WebView; this service only mirrors what the app reports (see MusikePlaybackPlugin) and relays the buttons back.
 * Everything here runs on the main thread.
 */
// A media-session notification doesn't need the notification permission (Android 13+ exempts it).
@SuppressLint("NotificationPermission")
public class PlaybackService extends Service {

    private static final String TAG = "MusikePlayback";
    private static final String CHANNEL = "playback";
    private static final int NOTIFICATION_ID = 1;
    private static final String ACTION = "app.musike.android.action.";

    /** What the app last reported. */
    static final class NowPlaying {
        String title = "";
        String artist = "";
        String album = "";
        String artwork = "";
        boolean playing;
        long positionMs;
        /** When positionMs was measured (elapsedRealtime), so the system can keep the clock moving on its own. */
        long positionAt = SystemClock.elapsedRealtime();
        long durationMs;

        long currentPositionMs() {
            return playing ? positionMs + (SystemClock.elapsedRealtime() - positionAt) : positionMs;
        }
    }

    /** Receives the buttons pressed in the notification, on the lock screen or on headphones. */
    interface Listener {
        /** position is in seconds, or negative when the action has none. */
        void onAction(String action, double position);
    }

    static final NowPlaying state = new NowPlaying();
    static Listener listener;
    private static PlaybackService instance;

    private final Handler main = new Handler(Looper.getMainLooper());
    private MediaSession session;
    private NotificationManager notifications;
    private PowerManager.WakeLock wakeLock;
    private boolean foreground;
    private boolean noisyRegistered;
    private String artworkUrl = "";
    private Bitmap artwork;

    /** Shows what the app reported, starting the service when music starts. */
    static void refresh(Context context) {
        if (instance != null) {
            instance.render();
            return;
        }
        if (!state.playing) return;
        Intent intent = new Intent(context, PlaybackService.class);
        try {
            if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent);
            else context.startService(intent);
        } catch (RuntimeException e) {
            // Android may refuse while the app is in the background; the next report from the app tries again.
            Log.w(TAG, "Could not start the playback service", e);
        }
    }

    static void shutdown(Context context) {
        context.stopService(new Intent(context, PlaybackService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        notifications = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        wakeLock = ((PowerManager) getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Musike:playback");
        wakeLock.setReferenceCounted(false);

        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, getString(R.string.playback_channel), NotificationManager.IMPORTANCE_LOW);
            channel.setShowBadge(false);
            notifications.createNotificationChannel(channel);
        }

        session = new MediaSession(this, "Musike");
        session.setSessionActivity(openApp());
        if (Build.VERSION.SDK_INT < 26) {
            session.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        }
        session.setCallback(
            new MediaSession.Callback() {
                @Override
                public void onPlay() {
                    emit("play", -1);
                }

                @Override
                public void onPause() {
                    emit("pause", -1);
                }

                @Override
                public void onStop() {
                    emit("pause", -1);
                }

                @Override
                public void onSkipToNext() {
                    emit("next", -1);
                }

                @Override
                public void onSkipToPrevious() {
                    emit("previous", -1);
                }

                @Override
                public void onSeekTo(long positionMs) {
                    // Show the new position right away; the app confirms it once the audio gets there.
                    state.positionMs = positionMs;
                    state.positionAt = SystemClock.elapsedRealtime();
                    render();
                    emit("seek", positionMs / 1000.0);
                }
            },
            main
        );
        session.setActive(true);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (action != null && action.startsWith(ACTION)) {
            String name = action.substring(ACTION.length());
            if (listener == null) {
                // A leftover notification from an app Android already closed: there is no music to control.
                stopSelf();
                return START_NOT_STICKY;
            }
            if (name.equals("dismiss")) {
                if (!state.playing) stopSelf();
            } else {
                emit(name, -1);
            }
        } else {
            // Started by the app with startForegroundService: Android requires startForeground right away,
            // even if the music was paused again in the meantime.
            goForeground(buildNotification());
        }
        render();
        return START_NOT_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // Swiping Musike away closes the page that plays the music, so the controls have nothing left to control.
        stopSelf();
    }

    @Override
    public void onDestroy() {
        instance = null;
        releaseWakeLock();
        setNoisyReceiver(false);
        session.setActive(false);
        session.release();
        stopForeground(STOP_FOREGROUND_REMOVE);
        notifications.cancel(NOTIFICATION_ID);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void emit(String action, double position) {
        if (listener != null) listener.onAction(action, position);
    }

    private void render() {
        loadArtwork(state.artwork);
        session.setMetadata(metadata());
        session.setPlaybackState(playbackState());
        Notification notification = buildNotification();
        if (state.playing) {
            // Renewed by every progress report from the app; lapses if the app stops reporting.
            wakeLock.acquire(30 * 60 * 1000L);
            setNoisyReceiver(true);
            goForeground(notification);
        } else {
            releaseWakeLock();
            setNoisyReceiver(false);
            if (foreground) {
                // Paused: the notification stays (and can be swiped away), but Android may reclaim the service.
                stopForeground(STOP_FOREGROUND_DETACH);
                foreground = false;
            }
            notifications.notify(NOTIFICATION_ID, notification);
        }
    }

    private void goForeground(Notification notification) {
        if (foreground) {
            notifications.notify(NOTIFICATION_ID, notification);
            return;
        }
        try {
            if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            else startForeground(NOTIFICATION_ID, notification);
            foreground = true;
        } catch (RuntimeException e) {
            // Resuming from the background can be refused on recent Android; keep the controls up regardless.
            Log.w(TAG, "Could not enter the foreground", e);
            notifications.notify(NOTIFICATION_ID, notification);
        }
    }

    private MediaMetadata metadata() {
        MediaMetadata.Builder b = new MediaMetadata.Builder()
            .putString(MediaMetadata.METADATA_KEY_TITLE, state.title)
            .putString(MediaMetadata.METADATA_KEY_ARTIST, state.artist)
            .putString(MediaMetadata.METADATA_KEY_ALBUM, state.album)
            .putLong(MediaMetadata.METADATA_KEY_DURATION, state.durationMs > 0 ? state.durationMs : -1);
        if (artwork != null) b.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, artwork);
        return b.build();
    }

    private PlaybackState playbackState() {
        long actions =
            PlaybackState.ACTION_PLAY |
            PlaybackState.ACTION_PAUSE |
            PlaybackState.ACTION_PLAY_PAUSE |
            PlaybackState.ACTION_STOP |
            PlaybackState.ACTION_SKIP_TO_NEXT |
            PlaybackState.ACTION_SKIP_TO_PREVIOUS |
            PlaybackState.ACTION_SEEK_TO;
        return new PlaybackState.Builder()
            .setActions(actions)
            .setState(
                state.playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED,
                state.positionMs,
                state.playing ? 1f : 0f,
                state.positionAt
            )
            .build();
    }

    private Notification buildNotification() {
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        b.setSmallIcon(R.drawable.ic_stat_musike)
            .setContentTitle(state.title)
            .setContentText(state.artist)
            .setLargeIcon(artwork)
            .setContentIntent(openApp())
            .setDeleteIntent(command("dismiss"))
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setShowWhen(false)
            .setOngoing(state.playing)
            .setColor(0xFFC3EC52)
            .addAction(action(R.drawable.ic_media_previous, R.string.playback_previous, "previous"))
            .addAction(
                state.playing
                    ? action(R.drawable.ic_media_pause, R.string.playback_pause, "pause")
                    : action(R.drawable.ic_media_play, R.string.playback_play, "play")
            )
            .addAction(action(R.drawable.ic_media_next, R.string.playback_next, "next"))
            .setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0, 1, 2));
        return b.build();
    }

    private Notification.Action action(int icon, int label, String name) {
        return new Notification.Action.Builder(Icon.createWithResource(this, icon), getString(label), command(name)).build();
    }

    private PendingIntent command(String name) {
        Intent intent = new Intent(this, PlaybackService.class).setAction(ACTION + name);
        return PendingIntent.getService(this, name.hashCode(), intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private PendingIntent openApp() {
        Intent intent = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private void releaseWakeLock() {
        if (wakeLock.isHeld()) wakeLock.release();
    }

    // Audio focus (calls, other players) is left to the WebView: it takes focus when the music starts and pauses
    // or resumes it on its own. Asking for focus here too would take it away from the WebView, which then pauses.

    // Headphones unplugged or Bluetooth disconnected: pause instead of playing out loud.

    private final BroadcastReceiver onNoisy = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction()) && state.playing) emit("pause", -1);
        }
    };

    private void setNoisyReceiver(boolean on) {
        if (on == noisyRegistered) return;
        if (on) {
            IntentFilter filter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
            if (Build.VERSION.SDK_INT >= 33) registerReceiver(onNoisy, filter, RECEIVER_NOT_EXPORTED);
            else registerReceiver(onNoisy, filter);
        } else {
            unregisterReceiver(onNoisy);
        }
        noisyRegistered = on;
    }

    // Cover art for the notification and the lock screen, downloaded once per track.

    private void loadArtwork(String url) {
        if (url.equals(artworkUrl)) return;
        artworkUrl = url;
        artwork = null;
        if (url.isEmpty()) return;
        new Thread(
            () -> {
                Bitmap bitmap = download(url);
                main.post(() -> {
                    if (instance != this || !url.equals(artworkUrl) || bitmap == null) return;
                    artwork = bitmap;
                    render();
                });
            },
            "musike-artwork"
        ).start();
    }

    private static Bitmap download(String url) {
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setConnectTimeout(10_000);
            connection.setReadTimeout(10_000);
            try (InputStream in = connection.getInputStream()) {
                Bitmap bitmap = BitmapFactory.decodeStream(in);
                if (bitmap == null) return null;
                // Large bitmaps can exceed what the system accepts for a notification.
                int max = 512;
                int side = Math.max(bitmap.getWidth(), bitmap.getHeight());
                if (side <= max) return bitmap;
                float scale = (float) max / side;
                return Bitmap.createScaledBitmap(bitmap, Math.round(bitmap.getWidth() * scale), Math.round(bitmap.getHeight() * scale), true);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not load the cover art", e);
            return null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }
}
