# D:\Production\silica\scripts\generate-assets.ps1
Add-Type -AssemblyName System.Drawing

$assetsDir = "D:\Production\silica\assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
}

function Create-SilicaIcon {
    param(
        [int]$Width,
        [int]$Height,
        [string]$OutputPath,
        [bool]$IsSplash = $false
    )

    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background: Pristine Mineral Off-White #FAFAFC
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 250, 250, 252))
    $g.FillRectangle($bgBrush, 0, 0, $Width, $Height)

    # Center Glyph Calculation
    $scale = if ($IsSplash) { 0.28 } else { 0.58 }
    $glyphSize = [int]($Width * $scale)
    $x = ($Width - $glyphSize) / 2
    $y = ($Height - $glyphSize) / 2

    # Outer Glass Squircle (Charcoal Ink #141416)
    $inkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 20, 20, 22))
    $penWidth = [float]($glyphSize * 0.04)
    $lensRingPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 250, 250, 252)), $penWidth
    
    $cardRadius = [int]($glyphSize * 0.24)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $cardRadius * 2

    $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
    $path.AddArc($x + $glyphSize - $diameter, $y, $diameter, $diameter, 270, 90)
    $path.AddArc($x + $glyphSize - $diameter, $y + $glyphSize - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($x, $y + $glyphSize - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()

    # Draw charcoal rounded card
    $g.FillPath($inkBrush, $path)

    # Inside Card: Draw Pure Optical Lens Ring (Silica Glass)
    $lensRadius = [int]($glyphSize * 0.32)
    $lensX = $x + [int](($glyphSize - ($lensRadius * 2)) / 2)
    $lensY = $y + [int](($glyphSize - ($lensRadius * 2)) / 2)
    $g.DrawEllipse($lensRingPen, $lensX, $lensY, ($lensRadius * 2), ($lensRadius * 2))

    # Center Focus Diamond / Aperture Pill (White)
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $dotRadius = [int]($glyphSize * 0.10)
    $dotX = $x + [int](($glyphSize - ($dotRadius * 2)) / 2)
    $dotY = $y + [int](($glyphSize - ($dotRadius * 2)) / 2)
    $g.FillEllipse($whiteBrush, $dotX, $dotY, ($dotRadius * 2), ($dotRadius * 2))

    # If splash screen, draw "Silica" title below
    if ($IsSplash) {
        $font = New-Object System.Drawing.Font ("Arial", [float]($Width * 0.045), [System.Drawing.FontStyle]::Bold)
        $stringFormat = New-Object System.Drawing.StringFormat
        $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
        $textY = $y + $glyphSize + [int]($Height * 0.04)
        $g.DrawString("Silica", $font, $inkBrush, [float]($Width / 2), [float]$textY, $stringFormat)
    }

    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $OutputPath ($Width x $Height)"
}

Create-SilicaIcon -Width 1024 -Height 1024 -OutputPath "$assetsDir\icon.png"
Create-SilicaIcon -Width 1024 -Height 1024 -OutputPath "$assetsDir\adaptive-icon.png"
Create-SilicaIcon -Width 2048 -Height 2048 -OutputPath "$assetsDir\splash.png" -IsSplash $true
Create-SilicaIcon -Width 48 -Height 48 -OutputPath "$assetsDir\favicon.png"
