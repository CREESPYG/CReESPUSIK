Add-Type -AssemblyName System.Drawing

$sourcePath = "$PSScriptRoot\..\public\icon-512.png"
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source icon not found at $sourcePath"
    exit 1
}

$srcImg = [System.Drawing.Bitmap]::FromFile($sourcePath)

function Resize-Image {
    param(
        [System.Drawing.Bitmap]$source,
        [int]$targetWidth,
        [int]$targetHeight,
        [string]$destPath,
        [double]$scaleFactor = 1.0
    )

    $destBmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    if ($scaleFactor -eq 1.0) {
        $g.DrawImage($source, 0, 0, $targetWidth, $targetHeight)
    } else {
        $iconW = [int]($targetWidth * $scaleFactor)
        $iconH = [int]($targetHeight * $scaleFactor)
        $posX = [int](($targetWidth - $iconW) / 2)
        $posY = [int](($targetHeight - $iconH) / 2)
        $g.DrawImage($source, $posX, $posY, $iconW, $iconH)
    }

    $g.Dispose()
    
    $dir = [System.IO.Path]::GetDirectoryName($destPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    if (Test-Path $destPath) {
        Remove-Item $destPath -Force
    }

    $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Host "Created: $destPath ($($targetWidth)x$($targetHeight))"
}

$resDirs = @(
    "$PSScriptRoot\..\android\app\src\main\res",
    "$PSScriptRoot\..\mobile\android\app\src\main\res"
)

$densities = @(
    @{ Name = "mipmap-mdpi";    Legacy = 48;  Fg = 108 },
    @{ Name = "mipmap-hdpi";    Legacy = 72;  Fg = 162 },
    @{ Name = "mipmap-xhdpi";   Legacy = 96;  Fg = 216 },
    @{ Name = "mipmap-xxhdpi";  Legacy = 144; Fg = 324 },
    @{ Name = "mipmap-xxxhdpi"; Legacy = 192; Fg = 432 }
)
$splashDensities = @(
    @{ Path = "drawable\splash.png";                 W = 480;  H = 800 },
    @{ Path = "drawable-port-mdpi\splash.png";        W = 320;  H = 480 },
    @{ Path = "drawable-port-hdpi\splash.png";        W = 480;  H = 800 },
    @{ Path = "drawable-port-xhdpi\splash.png";       W = 720;  H = 1280 },
    @{ Path = "drawable-port-xxhdpi\splash.png";      W = 960;  H = 1600 },
    @{ Path = "drawable-port-xxxhdpi\splash.png";     W = 1280; H = 1920 },
    @{ Path = "drawable-land-mdpi\splash.png";        W = 480;  H = 320 },
    @{ Path = "drawable-land-hdpi\splash.png";        W = 800;  H = 480 },
    @{ Path = "drawable-land-xhdpi\splash.png";       W = 1280; H = 720 },
    @{ Path = "drawable-land-xxhdpi\splash.png";      W = 1600; H = 960 },
    @{ Path = "drawable-land-xxxhdpi\splash.png";     W = 1920; H = 1280 }
)

foreach ($resDir in $resDirs) {
    if (-not (Test-Path $resDir)) { continue }

    foreach ($d in $densities) {
        $folder = Join-Path $resDir $d.Name
        
        # Standard legacy launcher icon
        Resize-Image -source $srcImg -targetWidth $d.Legacy -targetHeight $d.Legacy -destPath (Join-Path $folder "ic_launcher.png")
        
        # Round legacy launcher icon
        Resize-Image -source $srcImg -targetWidth $d.Legacy -targetHeight $d.Legacy -destPath (Join-Path $folder "ic_launcher_round.png")
        
        # Adaptive icon foreground (safe zone is ~70% centered)
        Resize-Image -source $srcImg -targetWidth $d.Fg -targetHeight $d.Fg -destPath (Join-Path $folder "ic_launcher_foreground.png") -scaleFactor 0.72
    }

    foreach ($s in $splashDensities) {
        $dest = Join-Path $resDir $s.Path
        # Create dark background splash with centered icon
        $splashBmp = New-Object System.Drawing.Bitmap($s.W, $s.H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $sg = [System.Drawing.Graphics]::FromImage($splashBmp)
        $sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $sg.Clear([System.Drawing.Color]::FromArgb(255, 11, 12, 15)) # #0b0c0f

        $iconDim = [Math]::Min($s.W, $s.H) * 0.35
        $iconX = [int](($s.W - $iconDim) / 2)
        $iconY = [int](($s.H - $iconDim) / 2)
        $sg.DrawImage($srcImg, $iconX, $iconY, [int]$iconDim, [int]$iconDim)
        $sg.Dispose()

        $destDir = [System.IO.Path]::GetDirectoryName($dest)
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        if (Test-Path $dest) {
            Remove-Item $dest -Force
        }
        $splashBmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
        $splashBmp.Dispose()
        Write-Host "Created splash: $dest"
    }
}

$srcImg.Dispose()
Write-Host "All Android icons and splashes generated successfully!"
