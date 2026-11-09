# Compilation de PRÉVERSION sur Windows avec SDK .NET 8 ; ne publie aucune release.
param([Parameter(Mandatory=$true)][string]$ClePublique, [string]$Sortie = "$PSScriptRoot\..\..\dist-stipack\windows-preversion")
$ErrorActionPreference = 'Stop'
$ClePublique = (Resolve-Path -LiteralPath $ClePublique).Path
if ((Get-Content -Raw -LiteralPath $ClePublique) -notmatch '^-----BEGIN PUBLIC KEY-----') {
    throw 'Fournir uniquement la clé PUBLIQUE Ed25519 SPKI, jamais la clé privée.'
}
dotnet publish "$PSScriptRoot\STILabo3.csproj" -c Release -r win-x64 --self-contained true "-p:Labo3PublicKey=$ClePublique" -o $Sortie
if ($LASTEXITCODE -ne 0) { throw 'Compilation échouée ; ne pas distribuer les fichiers.' }
Write-Host 'Préversion compilée : contrôle des autorisations uniquement, pas encore un installateur.'
Get-FileHash -Algorithm SHA256 (Join-Path $Sortie 'STI-Labo3-Installation.exe')
