# Exécuter sur chaque poste Windows ; aucun accès réseau, aucun mot de passe.
param([string]$Sortie = (Join-Path $PSScriptRoot 'poste-labo3.json'))
$ErrorActionPreference = 'Stop'
$Guid = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Cryptography' -Name MachineGuid).MachineGuid
$Guid = ([Guid]::Parse($Guid)).ToString('D').ToLowerInvariant()
$Sha = [Security.Cryptography.SHA256]::Create()
try {
    $Bytes = [Text.Encoding]::UTF8.GetBytes("STI-LABO3/1`n" + $Guid)
    $Empreinte = ([BitConverter]::ToString($Sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant()
} finally { $Sha.Dispose() }
# Pas de nom de personne ni de MachineGuid brut dans le fichier exporté.
if (Test-Path -LiteralPath $Sortie) { throw 'Le fichier de sortie existe déjà ; choisissez un autre nom.' }
@{ format = 'STI-LABO3-POSTE/1'; empreinte = $Empreinte } | ConvertTo-Json | Set-Content -LiteralPath $Sortie -Encoding UTF8
Write-Host "Empreinte du poste enregistrée dans $Sortie"
