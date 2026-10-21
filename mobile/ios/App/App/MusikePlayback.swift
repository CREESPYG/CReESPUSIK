import AVFoundation
import Capacitor
import MediaPlayer
import UIKit
import WebKit

/// The iOS side of the player: the lock screen, Control Center and the headphone buttons.
///
/// The web app talks to it over the `musikeMedia` message handler (web/src/native/media.ts) and it talks back with
/// `window.__musikeMediaAction(...)` — the same actions Android's MusikePlaybackPlugin sends, so the player code on
/// both platforms is the one already written for Android.
final class MusikePlayback: NSObject, WKScriptMessageHandler {
    private weak var webView: WKWebView?
    private var nowPlaying: [String: Any] = [:]
    private var artworks: [String: MPMediaItemArtwork] = [:]
    private var artworkURL = ""
    private var artworkTask: URLSessionDataTask?

    override init() {
        super.init()
        let session = AVAudioSession.sharedInstance()
        // Playback: the music keeps going with the screen off. Activating it happens when something plays, so the
        // app doesn't take the audio away from whatever the user was listening to before opening Musike.
        try? session.setCategory(.playback, mode: .default)
        configureCommands()
    }

    /** Called once the web view exists, so the lock screen's buttons have somewhere to go. */
    func attach(_ webView: WKWebView?) {
        self.webView = webView
    }

    // MARK: - The lock screen's buttons

    private func configureCommands() {
        let center = MPRemoteCommandCenter.shared()
        center.playCommand.addTarget { [weak self] _ in
            self?.send("play")
            return .success
        }
        center.pauseCommand.addTarget { [weak self] _ in
            self?.send("pause")
            return .success
        }
        center.togglePlayPauseCommand.addTarget { [weak self] _ in
            self?.send("toggle")
            return .success
        }
        center.nextTrackCommand.addTarget { [weak self] _ in
            self?.send("next")
            return .success
        }
        center.previousTrackCommand.addTarget { [weak self] _ in
            self?.send("previous")
            return .success
        }
        center.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let seek = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            self?.send("seek", position: seek.positionTime)
            return .success
        }
    }

    private func send(_ action: String, position: Double? = nil) {
        var js = "window.__musikeMediaAction && window.__musikeMediaAction('\(action)')"
        if let position { js = "window.__musikeMediaAction && window.__musikeMediaAction('\(action)', \(position))" }
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js)
        }
    }

    // MARK: - What the web app sends

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "musikeMedia",
              let body = message.body as? [String: Any],
              let type = body["type"] as? String
        else { return }
        switch type {
        case "track": setTrack(body)
        case "state": setState(body)
        default: break
        }
    }

    private func setTrack(_ body: [String: Any]) {
        nowPlaying[MPMediaItemPropertyTitle] = body["title"] as? String ?? ""
        nowPlaying[MPMediaItemPropertyArtist] = body["artist"] as? String ?? ""
        nowPlaying[MPMediaItemPropertyAlbumTitle] = body["album"] as? String ?? ""
        nowPlaying[MPNowPlayingInfoPropertyElapsedPlaybackTime] = number(body["position"])
        if number(body["duration"]) > 0 { nowPlaying[MPMediaItemPropertyPlaybackDuration] = number(body["duration"]) }
        publish()
        if let link = body["artwork"] as? String { loadArtwork(link) }
    }

    private func setState(_ body: [String: Any]) {
        let playing = body["playing"] as? Bool ?? false
        nowPlaying[MPNowPlayingInfoPropertyElapsedPlaybackTime] = number(body["position"])
        nowPlaying[MPNowPlayingInfoPropertyPlaybackRate] = playing ? 1.0 : 0.0
        if number(body["duration"]) > 0 { nowPlaying[MPMediaItemPropertyPlaybackDuration] = number(body["duration"]) }
        if playing { try? AVAudioSession.sharedInstance().setActive(true) }
        publish(state: playing ? .playing : .paused)
    }

    private func publish(state: MPNowPlayingPlaybackState? = nil) {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlaying
        if let state { MPNowPlayingInfoCenter.default().playbackState = state }
    }

    private func number(_ value: Any?) -> Double {
        if let d = value as? Double { return d }
        if let n = value as? NSNumber { return n.doubleValue }
        return 0
    }

    // MARK: - Artwork

    private func loadArtwork(_ link: String) {
        guard link != artworkURL, let url = URL(string: link), url.scheme == "https" else { return }
        artworkURL = link
        if let cached = artworks[link] {
            nowPlaying[MPMediaItemPropertyArtwork] = cached
            publish()
            return
        }
        artworkTask?.cancel()
        artworkTask = URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            guard let self, let data, let image = UIImage(data: data), link == self.artworkURL else { return }
            let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
            DispatchQueue.main.async {
                if self.artworks.count > 8 { self.artworks.removeAll() }
                self.artworks[link] = artwork
                self.nowPlaying[MPMediaItemPropertyArtwork] = artwork
                self.publish()
            }
        }
        artworkTask?.resume()
    }
}
