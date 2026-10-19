$ErrorActionPreference = "Stop"
$Root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$Prefix = "http://127.0.0.1:8088/"
$Mime = @{
  ".html"="text/html; charset=utf-8"; ".htm"="text/html; charset=utf-8"; ".js"="text/javascript; charset=utf-8";
  ".css"="text/css; charset=utf-8"; ".json"="application/json; charset=utf-8"; ".webmanifest"="application/manifest+json";
  ".svg"="image/svg+xml"; ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".webp"="image/webp"; ".avif"="image/avif"; ".gif"="image/gif"; ".ico"="image/x-icon";
  ".mp4"="video/mp4"; ".webm"="video/webm"; ".mp3"="audio/mpeg"; ".m4a"="audio/mp4"; ".wav"="audio/wav"; ".vtt"="text/vtt; charset=utf-8";
  ".pdf"="application/pdf"; ".zip"="application/zip"; ".rar"="application/vnd.rar"; ".docx"="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
$Listener = [System.Net.HttpListener]::new()
$Listener.Prefixes.Add($Prefix)
try { $Listener.Start() } catch { Write-Host "Impossible de démarrer le serveur local sur le port 8088." -ForegroundColor Red; Write-Host $_.Exception.Message; Read-Host "Entrée pour fermer"; exit 1 }
Write-Host "STI V2.0 Labo 3 — serveur local actif : $Prefix" -ForegroundColor Green
Start-Process ($Prefix + "index.html")
try {
  while ($Listener.IsListening) {
    $Context = $Listener.GetContext(); $Request = $Context.Request; $Response = $Context.Response
    try {
      $Relative = [Uri]::UnescapeDataString($Request.Url.AbsolutePath.TrimStart('/')).Replace('/', [IO.Path]::DirectorySeparatorChar)
      if ([string]::IsNullOrWhiteSpace($Relative)) { $Relative = "index.html" }
      $File = [IO.Path]::GetFullPath((Join-Path $Root $Relative))
      if (-not $File.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase)) { $Response.StatusCode=403; $Response.Close(); continue }
      if ([IO.Directory]::Exists($File)) { $File = Join-Path $File "index.html" }
      if (-not [IO.File]::Exists($File)) { $Response.StatusCode=404; $Response.Close(); continue }
      $Info=[IO.FileInfo]$File; $Length=$Info.Length; $Ext=$Info.Extension.ToLowerInvariant(); $Response.ContentType=($(if($Mime.ContainsKey($Ext)){$Mime[$Ext]}else{"application/octet-stream"}));
      $Start=0L; $End=$Length-1; $Range=$Request.Headers["Range"]
      if ($Range -and $Range -match '^bytes=(\d*)-(\d*)$') {
        if ($Matches[1]) { $Start=[Int64]$Matches[1] }; if ($Matches[2]) { $End=[Int64]$Matches[2] }
        if ($End -ge $Length) { $End=$Length-1 }; if ($Start -le $End) { $Response.StatusCode=206; $Response.AddHeader("Content-Range", "bytes $Start-$End/$Length") }
      }
      $Count=$End-$Start+1; $Response.ContentLength64=$Count; $Response.AddHeader("Accept-Ranges","bytes"); $Response.AddHeader("Cache-Control","no-cache")
      if ($Request.HttpMethod -ne "HEAD") {
        $Stream=[IO.File]::OpenRead($File); try { $Stream.Seek($Start,[IO.SeekOrigin]::Begin)|Out-Null; $Buffer=New-Object byte[] 65536; $Remaining=$Count; while($Remaining -gt 0){$Read=$Stream.Read($Buffer,0,[Math]::Min($Buffer.Length,$Remaining));if($Read -le 0){break};$Response.OutputStream.Write($Buffer,0,$Read);$Remaining-=$Read} } finally { $Stream.Dispose() }
      }
      $Response.OutputStream.Close()
    } catch { try{$Response.StatusCode=500;$Response.Close()}catch{} }
  }
} finally { $Listener.Stop(); $Listener.Close() }
