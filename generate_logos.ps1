Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\dache\Desktop\ulmgh\369be\tests\image.png"
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source logo file not found at $sourcePath"
    exit 1
}

$sourceImg = [System.Drawing.Bitmap]::FromFile($sourcePath)
$srcWidth = $sourceImg.Width
$srcHeight = $sourceImg.Height
Write-Host "Loaded master logo: ${srcWidth}x${srcHeight}"

function Resize-ImageToFit {
    param (
        [System.Drawing.Bitmap]$src,
        [int]$targetWidth,
        [int]$targetHeight,
        [double]$scaleRatio = 1.0,
        [System.Drawing.Color]$bgColor = [System.Drawing.Color]::Transparent,
        [bool]$isRound = $false,
        [string]$outputPath
    )

    $destBmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # If round icon, draw white circle background and set circular clip
    if ($isRound) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $targetWidth, $targetHeight)
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $g.FillPath($brush, $path)
        $brush.Dispose()
        $g.SetClip($path)
    } elseif ($bgColor -ne [System.Drawing.Color]::Transparent) {
        $brush = New-Object System.Drawing.SolidBrush($bgColor)
        $g.FillRectangle($brush, 0, 0, $targetWidth, $targetHeight)
        $brush.Dispose()
    }

    # Calculate proportional contain fit
    $maxWidth = $targetWidth * $scaleRatio
    $maxHeight = $targetHeight * $scaleRatio
    $aspect = $src.Width / $src.Height

    $drawWidth = $maxWidth
    $drawHeight = $maxWidth / $aspect

    if ($drawHeight -gt $maxHeight) {
        $drawHeight = $maxHeight
        $drawWidth = $maxHeight * $aspect
    }

    $destX = ($targetWidth - $drawWidth) / 2.0
    $destY = ($targetHeight - $drawHeight) / 2.0

    $destRect = New-Object System.Drawing.RectangleF($destX, $destY, $drawWidth, $drawHeight)
    $srcRect = New-Object System.Drawing.RectangleF(0, 0, $src.Width, $src.Height)

    $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $g.Dispose()

    # Ensure parent dir exists
    $parent = [System.IO.Path]::GetDirectoryName($outputPath)
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    $destBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Host "Generated: $outputPath (${targetWidth}x${targetHeight})"
}

# 1. Web Assets (Direct copy of full resolution master logo)
$webPaths = @(
    "369/src/assets/logo.png",
    "369/public/logo.png",
    "369/public/image.png",
    "369/android/app/src/main/assets/public/logo.png",
    "369/android/app/src/main/assets/public/image.png",
    "369/android-vendor/app/src/main/assets/public/logo.png",
    "369/android-vendor/app/src/main/assets/public/image.png"
)

foreach ($wp in $webPaths) {
    $full = [System.IO.Path]::GetFullPath($wp)
    $dir = [System.IO.Path]::GetDirectoryName($full)
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Copy-Item $sourcePath $full -Force
    Write-Host "Copied master logo to: $wp"
}

# 2. Update favicon.svg wrapper
$faviconSvg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1355 1160">
  <image href="/logo.png" width="1355" height="1160"/>
</svg>
"@
Set-Content -Path "369/public/favicon.svg" -Value $faviconSvg
Write-Host "Updated: 369/public/favicon.svg"

# 3. Android Apps - Launcher Icons & Splash Screens for Customer & Vendor
$androidRoots = @(
    "369/android/app/src/main/res",
    "369/android-vendor/app/src/main/res"
)

$launcherDensities = @(
    @{ Name = "mdpi"; Size = 48; FgSize = 108 },
    @{ Name = "hdpi"; Size = 72; FgSize = 162 },
    @{ Name = "xhdpi"; Size = 96; FgSize = 216 },
    @{ Name = "xxhdpi"; Size = 144; FgSize = 324 },
    @{ Name = "xxxhdpi"; Size = 192; FgSize = 432 }
)

$splashes = @(
    @{ Dir = "drawable"; Width = 480; Height = 320; IsLand = $true },
    @{ Dir = "drawable-land-mdpi"; Width = 480; Height = 320; IsLand = $true },
    @{ Dir = "drawable-land-hdpi"; Width = 800; Height = 480; IsLand = $true },
    @{ Dir = "drawable-land-xhdpi"; Width = 1280; Height = 720; IsLand = $true },
    @{ Dir = "drawable-land-xxhdpi"; Width = 1600; Height = 960; IsLand = $true },
    @{ Dir = "drawable-land-xxxhdpi"; Width = 1920; Height = 1280; IsLand = $true },
    @{ Dir = "drawable-port-mdpi"; Width = 320; Height = 480; IsLand = $false },
    @{ Dir = "drawable-port-hdpi"; Width = 480; Height = 800; IsLand = $false },
    @{ Dir = "drawable-port-xhdpi"; Width = 720; Height = 1280; IsLand = $false },
    @{ Dir = "drawable-port-xxhdpi"; Width = 960; Height = 1600; IsLand = $false },
    @{ Dir = "drawable-port-xxxhdpi"; Width = 1280; Height = 1920; IsLand = $false }
)

foreach ($root in $androidRoots) {
    Write-Host "`nProcessing Android resources in $root..."

    # Launcher Icons
    foreach ($d in $launcherDensities) {
        $folder = "$root/mipmap-$($d.Name)"
        
        # ic_launcher.png (fitted with 85% scale on clean white background)
        Resize-ImageToFit -src $sourceImg -targetWidth $d.Size -targetHeight $d.Size -scaleRatio 0.85 -bgColor ([System.Drawing.Color]::White) -outputPath "$folder/ic_launcher.png"
        
        # ic_launcher_round.png (fitted inside circular mask with 70% scale so no edges clip)
        Resize-ImageToFit -src $sourceImg -targetWidth $d.Size -targetHeight $d.Size -scaleRatio 0.70 -isRound $true -outputPath "$folder/ic_launcher_round.png"
        
        # ic_launcher_foreground.png (safe zone is 66% inside 108dp canvas for Android adaptive icons)
        Resize-ImageToFit -src $sourceImg -targetWidth $d.FgSize -targetHeight $d.FgSize -scaleRatio 0.65 -bgColor ([System.Drawing.Color]::Transparent) -outputPath "$folder/ic_launcher_foreground.png"
    }

    # Splash Screens (white background, centered logo proportionally scaled)
    foreach ($s in $splashes) {
        $outPath = "$root/$($s.Dir)/splash.png"
        $ratio = if ($s.IsLand) { 0.55 } else { 0.65 }
        Resize-ImageToFit -src $sourceImg -targetWidth $s.Width -targetHeight $s.Height -scaleRatio $ratio -bgColor ([System.Drawing.Color]::White) -outputPath $outPath
    }
}

$sourceImg.Dispose()
Write-Host "`nAll logos, launcher icons, and splash screens generated successfully!"
