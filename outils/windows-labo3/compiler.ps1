# ============================================================================
# compiler.ps1 — publication de « STI v2.0 version spéciale Labo 3 »
# ----------------------------------------------------------------------------
# À exécuter sur un poste de préparation Windows avec SDK .NET 8.
#
# Deux modes, au choix :
#
#   SANS -ClePublique (défaut, celui que publie la CI)
#       Installateur simple : aucune clé embarquée, aucune restriction de postes.
#       Toute machine qui reçoit le support USB peut installer et ouvrir la
#       plateforme. C'est le parcours « copier, double-cliquer, installer ».
#
#   AVEC -ClePublique
#       Installateur restreint : la clé PUBLIQUE Ed25519 est embarquée à la
#       compilation et décide quelles autorisations signées seront acceptées hors
#       ligne (20 postes maximum). Ne jamais passer la clé privée, ni la copier
#       sur le support distribué.
#
#   .\outils\windows-labo3\compiler.ps1
#   .\outils\windows-labo3\compiler.ps1 -Tester
#   .\outils\windows-labo3\compiler.ps1 -ClePublique C:\Administration\publique.pem
#
# Aucun artefact n'est publié sur GitHub par ce script.
# ==========================================================================
param(
    [string]$ClePublique,
    [string]$Sortie = "$PSScriptRoot\..\..\dist-stipack\windows-labo3",
    [switch]$Tester
)
$ErrorActionPreference = 'Stop'
$Restreint = -not [string]::IsNullOrWhiteSpace($ClePublique)

if ($Restreint) {
    $ClePublique = (Resolve-Path -LiteralPath $ClePublique).Path
    if ((Get-Content -Raw -LiteralPath $ClePublique) -notmatch '^-----BEGIN PUBLIC KEY-----') {
        throw 'Fournir uniquement la clé PUBLIQUE Ed25519 (SPKI), jamais la clé privée.'
    }
    # Contrôle avant compilation : une clé invalide produirait un installateur qui
    # refuse toutes les autorisations, sans erreur visible.
    if (Get-Command node -ErrorAction SilentlyContinue) {
        node (Join-Path $PSScriptRoot 'verifier-cle-publique.mjs') $ClePublique
        if ($LASTEXITCODE -ne 0) { throw 'Clé publique refusée : compilation annulée.' }
    } else {
        # Apostrophe droite et guillemets doubles : PowerShell traite U+2019 comme un
        # délimiteur de chaîne, ce qui casse l analyse du script.
        Write-Warning "Node.js absent : la clé publique n'a pas pu être vérifiée avant compilation."
    }
} else {
    Write-Host 'Mode simple : aucune clé publique embarquée, aucun poste restreint.'
}

if ($Tester) {
    $fixture = Join-Path $env:TEMP ("sti-labo3-fixture-" + [guid]::NewGuid().ToString('N'))
    $guid = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Cryptography').MachineGuid
    node "$PSScriptRoot\..\windows-labo3-tests\preparer-fixture.mjs" $fixture $guid
    if ($LASTEXITCODE -ne 0) { throw 'Préparation de la fixture de test échouée.' }
    dotnet run --project "$PSScriptRoot\..\windows-labo3-tests\STILabo3.Tests.csproj" -c Release "-p:Labo3PublicKey=$fixture\publique.pem" -- $fixture
    if ($LASTEXITCODE -ne 0) { Remove-Item -Recurse -Force $fixture; throw 'Tests Windows échoués : ne pas publier.' }
    Remove-Item -Recurse -Force $fixture
}

$Arguments = @(
    "$PSScriptRoot\STILabo3.csproj",
    '-c', 'Release', '-r', 'win-x64', '--self-contained', 'true',
    '-p:PublishSingleFile=true', '-p:IncludeNativeLibrariesForSelfExtract=true',
    '-o', $Sortie
)
if ($Restreint) { $Arguments += "-p:Labo3PublicKey=$ClePublique" }
& dotnet publish @Arguments
if ($LASTEXITCODE -ne 0) { throw 'Publication échouée ; ne pas distribuer les fichiers partiels.' }

$exe = Join-Path $Sortie 'STI-Labo3-Installation.exe'
if (-not (Test-Path -LiteralPath $exe)) { throw 'Exécutable absent de la sortie de publication.' }

# Contrôle final : l'exécutable publié doit embarquer exactement la clé publique
# fournie, ou aucune clé en mode simple. L'empreinte est lue depuis le binaire.
$rapport = Join-Path $env:TEMP ("sti-labo3-cle-" + [guid]::NewGuid().ToString('N') + ".txt")
try {
    $processus = Start-Process -FilePath $exe -ArgumentList '--afficher-cle', "`"$rapport`"" -Wait -PassThru -WindowStyle Hidden
    if ($processus.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $rapport)) {
        throw "L'exécutable publié n'a pas répondu au contrôle de clé (code $($processus.ExitCode))."
    }
    $embarquee = (Get-Content -Raw -LiteralPath $rapport).Trim()
    if ($Restreint) {
        $attendue = (Get-FileHash -Algorithm SHA256 -LiteralPath $ClePublique).Hash.ToLowerInvariant()
        if ($embarquee -ne $attendue) {
            throw "Clé embarquée ($embarquee) différente de la clé fournie ($attendue) : publication refusée."
        }
        Write-Host "Clé publique embarquée vérifiée : $embarquee"
    } else {
        if ($embarquee -ne 'ABSENTE') {
            throw "Installateur simple attendu sans clé embarquée, reçu : $embarquee. Publication refusée."
        }
        Write-Host 'Aucune clé embarquée, comme attendu en mode simple.'
    }
}
finally { if (Test-Path -LiteralPath $rapport) { Remove-Item -Force -LiteralPath $rapport } }

Write-Host "Publication autonome : $exe"
if ($Restreint) {
    Write-Host 'Rappels avant diffusion : tester sur un poste autorisé ET sur un poste non autorisé ;'
    Write-Host 'vérifier le refus sans Internet ; ne jamais joindre la clé privée au support USB.'
} else {
    Write-Host 'Rappels avant diffusion : ce binaire accepte tous les postes. Ne le distribuez que'
    Write-Host 'sur des supports que vous contrôlez ; une copie du support installe la plateforme ailleurs.'
}
Get-FileHash -Algorithm SHA256 $exe
