$ErrorActionPreference = "Stop"
$BASE_URL = "http://localhost:3000/api"
$PASS = 0
$FAIL = 0
$COOKIE_A = [System.IO.Path]::GetTempFileName()
$COOKIE_B = [System.IO.Path]::GetTempFileName()

# ===========================================================================
# HELPERS
# ===========================================================================

function Test-Result([string]$Name, [string]$Actual, [string]$Expected) {
    if ($Actual -eq $Expected) {
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:PASS++
    } else {
        Write-Host "  [FAIL] $Name  --  attendu: $Expected  recu: $Actual" -ForegroundColor Red
        $script:FAIL++
    }
}

function Parse-Json([string]$Json) {
    if (-not $Json) { return $null }
    try { return $Json | ConvertFrom-Json } catch { return $null }
}

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Token = "",
        [string]$Body = "",
        [string]$CookieFile = ""
    )
    $out = [System.IO.Path]::GetTempFileName()
    $curlArgs = [System.Collections.Generic.List[string]]::new()
    $curlArgs.AddRange([string[]]@("-s", "-o", $out, "-w", "%{http_code}", "-X", $Method, "$BASE_URL$Endpoint"))
    if ($Token) {
        $curlArgs.Add("-H")
        $curlArgs.Add("Authorization: Bearer $Token")
    }
    if ($Body) {
        $bodyFile = [System.IO.Path]::GetTempFileName()
        [IO.File]::WriteAllText($bodyFile, $Body, [System.Text.Encoding]::UTF8)
        $curlArgs.Add("-H")
        $curlArgs.Add("Content-Type: application/json")
        $curlArgs.Add("-d")
        $curlArgs.Add("@$bodyFile")
    }
    if ($CookieFile) {
        $curlArgs.Add("-b")
        $curlArgs.Add($CookieFile)
        $curlArgs.Add("-c")
        $curlArgs.Add($CookieFile)
    }
    $statusCode = & curl.exe $curlArgs.ToArray()
    $responseBody = Get-Content $out -Raw -ErrorAction SilentlyContinue
    Remove-Item $out -ErrorAction SilentlyContinue
    if ($bodyFile) { Remove-Item $bodyFile -ErrorAction SilentlyContinue }
    return @{ Status = "$statusCode"; Body = $responseBody }
}

function Count-Items([string]$Json) {
    $parsed = Parse-Json $Json
    if ($null -eq $parsed) { return 0 }
    if ($parsed -is [array]) { return $parsed.Count }
    if ($parsed -is [System.Object[]]) { return $parsed.Count }
    return 1
}

# ===========================================================================
# SETUP
# ===========================================================================

$RAND = Get-Random -Maximum 99999
$EMAIL_A = "usera_$RAND@example.com"
$EMAIL_B = "userb_$RAND@example.com"
$PASSWORD = "Password123!"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TEST API - Memo App Backend" -ForegroundColor Cyan
Write-Host "  $BASE_URL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ===========================================================================
# 1. SANTE DU SERVEUR
# ===========================================================================

Write-Host "`n[1] SANTE DU SERVEUR" -ForegroundColor Yellow

$res = Invoke-Api -Method "GET" -Endpoint "/health"
Test-Result "GET /health retourne 200" $res.Status "200"

# ===========================================================================
# 2. AUTHENTIFICATION
# ===========================================================================

Write-Host "`n[2] AUTHENTIFICATION" -ForegroundColor Yellow

# --- Inscription User A ---
$res = Invoke-Api -Method "POST" -Endpoint "/auth/register" `
    -Body "{`"name`":`"User A`",`"email`":`"$EMAIL_A`",`"password`":`"$PASSWORD`"}" `
    -CookieFile $COOKIE_A
Test-Result "POST /auth/register (User A) retourne 201" $res.Status "201"
$TOKEN_A = (Parse-Json $res.Body).accessToken
$USER_A_ID = (Parse-Json $res.Body).user.id
if (-not $TOKEN_A -or -not $USER_A_ID) {
    Write-Host "`nFATAL: Inscription User A echouee. Verifiez que le serveur tourne sur $BASE_URL" -ForegroundColor Red
    exit 1
}

# --- Inscription User B ---
$res = Invoke-Api -Method "POST" -Endpoint "/auth/register" `
    -Body "{`"name`":`"User B`",`"email`":`"$EMAIL_B`",`"password`":`"$PASSWORD`"}" `
    -CookieFile $COOKIE_B
Test-Result "POST /auth/register (User B) retourne 201" $res.Status "201"
$TOKEN_B = (Parse-Json $res.Body).accessToken
$USER_B_ID = (Parse-Json $res.Body).user.id
if (-not $TOKEN_B -or -not $USER_B_ID) {
    Write-Host "`nFATAL: Inscription User B echouee." -ForegroundColor Red
    exit 1
}

# --- Email deja utilise ---
$res = Invoke-Api -Method "POST" -Endpoint "/auth/register" `
    -Body "{`"name`":`"Doublon`",`"email`":`"$EMAIL_A`",`"password`":`"$PASSWORD`"}"
Test-Result "POST /auth/register (email deja pris) retourne 409" $res.Status "409"

# --- Validation : email invalide ---
$res = Invoke-Api -Method "POST" -Endpoint "/auth/register" `
    -Body '{"name":"Test","email":"pas-un-email","password":"Password123!"}'
Test-Result "POST /auth/register (email invalide) retourne 400" $res.Status "400"

# --- Validation : mot de passe trop court ---
$res = Invoke-Api -Method "POST" -Endpoint "/auth/register" `
    -Body '{"name":"Test","email":"short@test.com","password":"court"}'
Test-Result "POST /auth/register (password < 8 chars) retourne 400" $res.Status "400"

# --- Mauvais mot de passe ---
$res = Invoke-Api -Method "POST" -Endpoint "/auth/login" `
    -Body "{`"email`":`"$EMAIL_A`",`"password`":`"MauvaisMotDePasse!`"}"
Test-Result "POST /auth/login (mauvais mot de passe) retourne 401" $res.Status "401"

# --- Connexion valide (User A) + sauvegarde cookie refresh ---
$res = Invoke-Api -Method "POST" -Endpoint "/auth/login" `
    -Body "{`"email`":`"$EMAIL_A`",`"password`":`"$PASSWORD`"}" `
    -CookieFile $COOKIE_A
Test-Result "POST /auth/login (credentials valides) retourne 200" $res.Status "200"
$TOKEN_A = (Parse-Json $res.Body).accessToken
if (-not $TOKEN_A) {
    Write-Host "`nFATAL: Login User A echoue." -ForegroundColor Red
    exit 1
}

# --- GET /auth/me sans token ---
$res = Invoke-Api -Method "GET" -Endpoint "/auth/me"
Test-Result "GET /auth/me (sans token) retourne 401" $res.Status "401"

# --- GET /auth/me avec token ---
$res = Invoke-Api -Method "GET" -Endpoint "/auth/me" -Token $TOKEN_A
Test-Result "GET /auth/me (avec token valide) retourne 200" $res.Status "200"

# --- Refresh token (utilise le cookie httpOnly) ---
$res = Invoke-Api -Method "POST" -Endpoint "/auth/refresh" -CookieFile $COOKIE_A
Test-Result "POST /auth/refresh (cookie valide) retourne 200" $res.Status "200"
$newToken = (Parse-Json $res.Body).accessToken
if ($newToken) { $TOKEN_A = $newToken }

# --- Logout ---
$res = Invoke-Api -Method "POST" -Endpoint "/auth/logout" -CookieFile $COOKIE_A
Test-Result "POST /auth/logout retourne 200" $res.Status "200"

# --- Refresh apres logout (token blackliste dans Redis) ---
$res = Invoke-Api -Method "POST" -Endpoint "/auth/refresh" -CookieFile $COOKIE_A
Test-Result "POST /auth/refresh (apres logout, token blackliste) retourne 401" $res.Status "401"

# --- Re-login pour continuer les tests ---
$res = Invoke-Api -Method "POST" -Endpoint "/auth/login" `
    -Body "{`"email`":`"$EMAIL_A`",`"password`":`"$PASSWORD`"}"
$TOKEN_A = (Parse-Json $res.Body).accessToken

# ===========================================================================
# 3. WORKSPACE CRUD
# ===========================================================================

Write-Host "`n[3] WORKSPACE CRUD" -ForegroundColor Yellow

# --- Creation workspace ---
$res = Invoke-Api -Method "POST" -Endpoint "/workspaces" -Token $TOKEN_A `
    -Body '{"name":"Mon Workspace","description":"Workspace de test"}'
Test-Result "POST /workspaces retourne 201" $res.Status "201"
$WORKSPACE_ID = (Parse-Json $res.Body).id
if (-not $WORKSPACE_ID) {
    Write-Host "`nFATAL: Creation workspace echouee." -ForegroundColor Red
    exit 1
}

# --- Validation : nom trop court (< 2 chars) ---
$res = Invoke-Api -Method "POST" -Endpoint "/workspaces" -Token $TOKEN_A `
    -Body '{"name":"A"}'
Test-Result "POST /workspaces (nom trop court) retourne 400" $res.Status "400"

# --- Liste des workspaces ---
$res = Invoke-Api -Method "GET" -Endpoint "/workspaces" -Token $TOKEN_A
Test-Result "GET /workspaces retourne 200" $res.Status "200"

# --- Workspace par ID ---
$res = Invoke-Api -Method "GET" -Endpoint "/workspaces/$WORKSPACE_ID" -Token $TOKEN_A
Test-Result "GET /workspaces/:id retourne 200" $res.Status "200"

# --- Workspace par ID par un non-membre ---
$res = Invoke-Api -Method "GET" -Endpoint "/workspaces/$WORKSPACE_ID" -Token $TOKEN_B
Test-Result "GET /workspaces/:id (non-membre) retourne 403" $res.Status "403"

# --- Mise a jour du workspace ---
$res = Invoke-Api -Method "PATCH" -Endpoint "/workspaces/$WORKSPACE_ID" -Token $TOKEN_A `
    -Body '{"name":"Workspace Renomme"}'
Test-Result "PATCH /workspaces/:id retourne 200" $res.Status "200"
$updatedName = (Parse-Json $res.Body).name
Test-Result "PATCH /workspaces/:id met a jour le nom" $updatedName "Workspace Renomme"

# ===========================================================================
# 4. GESTION DES MEMBRES
# ===========================================================================

Write-Host "`n[4] GESTION DES MEMBRES" -ForegroundColor Yellow

# --- Ajouter User B comme VIEWER ---
$res = Invoke-Api -Method "POST" -Endpoint "/workspaces/$WORKSPACE_ID/members" -Token $TOKEN_A `
    -Body "{`"userId`":`"$USER_B_ID`",`"role`":`"VIEWER`"}"
Test-Result "POST /members (User B VIEWER) retourne 201" $res.Status "201"

# --- Ajouter User B une deuxieme fois ---
$res = Invoke-Api -Method "POST" -Endpoint "/workspaces/$WORKSPACE_ID/members" -Token $TOKEN_A `
    -Body "{`"userId`":`"$USER_B_ID`",`"role`":`"VIEWER`"}"
Test-Result "POST /members (deja membre) retourne 409" $res.Status "409"

# --- Promouvoir User B en EDITOR ---
$res = Invoke-Api -Method "PATCH" -Endpoint "/workspaces/$WORKSPACE_ID/members/$USER_B_ID" -Token $TOKEN_A `
    -Body '{"role":"EDITOR"}'
Test-Result "PATCH /members/:userId (VIEWER->EDITOR) retourne 200" $res.Status "200"

# --- Tentative de passer un role OWNER (interdit par le schema Zod) ---
$res = Invoke-Api -Method "PATCH" -Endpoint "/workspaces/$WORKSPACE_ID/members/$USER_B_ID" -Token $TOKEN_A `
    -Body '{"role":"OWNER"}'
Test-Result "PATCH /members/:userId (role=OWNER) retourne 400" $res.Status "400"

# --- Tentative de modifier le role de l'OWNER ---
$res = Invoke-Api -Method "PATCH" -Endpoint "/workspaces/$WORKSPACE_ID/members/$USER_A_ID" -Token $TOKEN_A `
    -Body '{"role":"EDITOR"}'
Test-Result "PATCH /members/:ownerId (changer role OWNER) retourne 403" $res.Status "403"

# --- Tentative de supprimer l'OWNER ---
$res = Invoke-Api -Method "DELETE" -Endpoint "/workspaces/$WORKSPACE_ID/members/$USER_A_ID" -Token $TOKEN_A
Test-Result "DELETE /members/:ownerId (supprimer OWNER) retourne 403" $res.Status "403"

# --- Supprimer User B ---
$res = Invoke-Api -Method "DELETE" -Endpoint "/workspaces/$WORKSPACE_ID/members/$USER_B_ID" -Token $TOKEN_A
Test-Result "DELETE /members/:userId retourne 204" $res.Status "204"

# ===========================================================================
# 5. RBAC
# ===========================================================================

Write-Host "`n[5] RBAC" -ForegroundColor Yellow

# --- Re-ajouter User B comme VIEWER ---
Invoke-Api -Method "POST" -Endpoint "/workspaces/$WORKSPACE_ID/members" -Token $TOKEN_A `
    -Body "{`"userId`":`"$USER_B_ID`",`"role`":`"VIEWER`"}" | Out-Null

# --- VIEWER tente de creer un dossier ---
$res = Invoke-Api -Method "POST" -Endpoint "/workspaces/$WORKSPACE_ID/folders" -Token $TOKEN_B `
    -Body '{"name":"Dossier VIEWER"}'
Test-Result "POST /folders (role VIEWER) retourne 403" $res.Status "403"

# --- Creer un dossier comme OWNER pour le test de note VIEWER ---
$tmpRes = Invoke-Api -Method "POST" -Endpoint "/workspaces/$WORKSPACE_ID/folders" -Token $TOKEN_A `
    -Body '{"name":"Dossier Temp RBAC"}'
$TMP_FOLDER_ID = (Parse-Json $tmpRes.Body).id

# --- VIEWER tente de creer une note ---
if ($TMP_FOLDER_ID) {
    $res = Invoke-Api -Method "POST" -Endpoint "/workspaces/$WORKSPACE_ID/folders/$TMP_FOLDER_ID/notes" -Token $TOKEN_B `
        -Body "{`"title`":`"Note VIEWER`",`"content`":{},`"folderId`":`"$TMP_FOLDER_ID`"}"
    Test-Result "POST /notes (role VIEWER) retourne 403" $res.Status "403"
}

# --- Promouvoir User B en EDITOR ---
Invoke-Api -Method "PATCH" -Endpoint "/workspaces/$WORKSPACE_ID/members/$USER_B_ID" -Token $TOKEN_A `
    -Body '{"role":"EDITOR"}' | Out-Null

# --- EDITOR cree un dossier ---
$res = Invoke-Api -Method "POST" -Endpoint "/workspaces/$WORKSPACE_ID/folders" -Token $TOKEN_B `
    -Body '{"name":"Dossier cree par EDITOR"}'
Test-Result "POST /folders (role EDITOR) retourne 201" $res.Status "201"
$EDITOR_FOLDER_ID = (Parse-Json $res.Body).id

# Nettoyage
if ($EDITOR_FOLDER_ID) {
    Invoke-Api -Method "DELETE" -Endpoint "/workspaces/$WORKSPACE_ID/folders/$EDITOR_FOLDER_ID" -Token $TOKEN_A | Out-Null
}
if ($TMP_FOLDER_ID) {
    Invoke-Api -Method "DELETE" -Endpoint "/workspaces/$WORKSPACE_ID/folders/$TMP_FOLDER_ID" -Token $TOKEN_A | Out-Null
}

# ===========================================================================
# 6. DOSSIERS (ARBORESCENCE)
# ===========================================================================

Write-Host "`n[6] DOSSIERS (ARBORESCENCE)" -ForegroundColor Yellow

# --- Creer un dossier racine ---
$res = Invoke-Api -Method "POST" -Endpoint "/workspaces/$WORKSPACE_ID/folders" -Token $TOKEN_A `
    -Body '{"name":"Dossier Racine"}'
Test-Result "POST /folders (racine) retourne 201" $res.Status "201"
$ROOT_FOLDER_ID = (Parse-Json $res.Body).id
if (-not $ROOT_FOLDER_ID) {
    Write-Host "`nFATAL: Creation dossier racine echouee." -ForegroundColor Red
    exit 1
}

# --- Creer un sous-dossier avec parentId ---
$res = Invoke-Api -Method "POST" -Endpoint "/workspaces/$WORKSPACE_ID/folders" -Token $TOKEN_A `
    -Body "{`"name`":`"Sous-Dossier`",`"parentId`":`"$ROOT_FOLDER_ID`"}"
Test-Result "POST /folders (sous-dossier avec parentId) retourne 201" $res.Status "201"
$SUB_FOLDER_ID = (Parse-Json $res.Body).id

# --- Lister les dossiers ---
$res = Invoke-Api -Method "GET" -Endpoint "/workspaces/$WORKSPACE_ID/folders" -Token $TOKEN_A
Test-Result "GET /folders (arborescence) retourne 200" $res.Status "200"

# --- Renommer le dossier racine ---
$res = Invoke-Api -Method "PATCH" -Endpoint "/workspaces/$WORKSPACE_ID/folders/$ROOT_FOLDER_ID" -Token $TOKEN_A `
    -Body '{"name":"Dossier Renomme"}'
Test-Result "PATCH /folders/:id (renommage) retourne 200" $res.Status "200"
$renamedFolder = (Parse-Json $res.Body).name
Test-Result "PATCH /folders/:id met a jour le nom" $renamedFolder "Dossier Renomme"

# --- Supprimer le sous-dossier ---
if ($SUB_FOLDER_ID) {
    $res = Invoke-Api -Method "DELETE" -Endpoint "/workspaces/$WORKSPACE_ID/folders/$SUB_FOLDER_ID" -Token $TOKEN_A
    Test-Result "DELETE /folders/:id (sous-dossier) retourne 204" $res.Status "204"
}

# ===========================================================================
# 7. NOTES (SOFT-DELETE & RESTORE)
# ===========================================================================

Write-Host "`n[7] NOTES (SOFT-DELETE & RESTORE)" -ForegroundColor Yellow

# --- Creer une note avec content JSON objet ---
$noteBody = "{`"title`":`"Ma Note`",`"content`":{`"type`":`"doc`",`"text`":`"Contenu initial`"},`"folderId`":`"$ROOT_FOLDER_ID`"}"
$res = Invoke-Api -Method "POST" -Endpoint "/workspaces/$WORKSPACE_ID/folders/$ROOT_FOLDER_ID/notes" -Token $TOKEN_A `
    -Body $noteBody
Test-Result "POST /notes (content objet JSON) retourne 201" $res.Status "201"
$NOTE_ID = (Parse-Json $res.Body).id
if (-not $NOTE_ID) {
    Write-Host "`nFATAL: Creation note echouee." -ForegroundColor Red
    exit 1
}

# --- Validation : note sans titre ---
$res = Invoke-Api -Method "POST" -Endpoint "/workspaces/$WORKSPACE_ID/folders/$ROOT_FOLDER_ID/notes" -Token $TOKEN_A `
    -Body "{`"content`":{},`"folderId`":`"$ROOT_FOLDER_ID`"}"
Test-Result "POST /notes (sans title) retourne 400" $res.Status "400"

# --- Validation : content de type string (invalide) ---
$res = Invoke-Api -Method "POST" -Endpoint "/workspaces/$WORKSPACE_ID/folders/$ROOT_FOLDER_ID/notes" -Token $TOKEN_A `
    -Body "{`"title`":`"Test`",`"content`":`"chaine de caracteres`",`"folderId`":`"$ROOT_FOLDER_ID`"}"
Test-Result "POST /notes (content string au lieu d'objet) retourne 400" $res.Status "400"

# --- Lister les notes (la note doit apparaitre) ---
$res = Invoke-Api -Method "GET" -Endpoint "/workspaces/$WORKSPACE_ID/folders/$ROOT_FOLDER_ID/notes" -Token $TOKEN_A
Test-Result "GET /folders/:id/notes retourne 200" $res.Status "200"
$noteCountBefore = Count-Items $res.Body
Test-Result "GET /folders/:id/notes contient 1 note active" "$noteCountBefore" "1"

# --- Recuperer la note par ID ---
$res = Invoke-Api -Method "GET" -Endpoint "/notes/$NOTE_ID" -Token $TOKEN_A
Test-Result "GET /notes/:id retourne 200" $res.Status "200"

# --- Mettre a jour la note ---
$res = Invoke-Api -Method "PATCH" -Endpoint "/notes/$NOTE_ID" -Token $TOKEN_A `
    -Body '{"title":"Note Mise a Jour","content":{"type":"doc","text":"Contenu modifie"}}'
Test-Result "PATCH /notes/:id retourne 200" $res.Status "200"
$updatedTitle = (Parse-Json $res.Body).title
Test-Result "PATCH /notes/:id met a jour le titre" $updatedTitle "Note Mise a Jour"

# --- Soft-delete de la note ---
$res = Invoke-Api -Method "DELETE" -Endpoint "/notes/$NOTE_ID" -Token $TOKEN_A
Test-Result "DELETE /notes/:id (soft-delete) retourne 204" $res.Status "204"

# --- La note ne doit plus apparaitre dans la liste ---
$res = Invoke-Api -Method "GET" -Endpoint "/workspaces/$WORKSPACE_ID/folders/$ROOT_FOLDER_ID/notes" -Token $TOKEN_A
$noteCountAfterDelete = Count-Items $res.Body
Test-Result "GET /notes apres soft-delete : liste vide (0)" "$noteCountAfterDelete" "0"

# --- Restore de la note ---
$res = Invoke-Api -Method "PATCH" -Endpoint "/notes/$NOTE_ID/restore" -Token $TOKEN_A
Test-Result "PATCH /notes/:id/restore retourne 200" $res.Status "200"
$deletedAtAfterRestore = (Parse-Json $res.Body).deletedAt
Test-Result "PATCH /notes/:id/restore vide deletedAt (null)" "$deletedAtAfterRestore" ""

# --- La note doit reapparaitre dans la liste ---
$res = Invoke-Api -Method "GET" -Endpoint "/workspaces/$WORKSPACE_ID/folders/$ROOT_FOLDER_ID/notes" -Token $TOKEN_A
$noteCountAfterRestore = Count-Items $res.Body
Test-Result "GET /notes apres restore : 1 note active" "$noteCountAfterRestore" "1"

# ===========================================================================
# 8. NETTOYAGE & VERIFICATION CASCADE
# ===========================================================================

Write-Host "`n[8] NETTOYAGE & CASCADE" -ForegroundColor Yellow

$res = Invoke-Api -Method "DELETE" -Endpoint "/workspaces/$WORKSPACE_ID" -Token $TOKEN_A
Test-Result "DELETE /workspaces/:id (cascade) retourne 204" $res.Status "204"

$res = Invoke-Api -Method "GET" -Endpoint "/workspaces/$WORKSPACE_ID" -Token $TOKEN_A
# Le middleware RBAC supprime le membership en cascade -> l'utilisateur n'est plus membre -> 403 (et non 404)
Test-Result "GET /workspaces/:id apres suppression retourne 403" $res.Status "403"

# ===========================================================================
# RECAP
# ===========================================================================

Remove-Item $COOKIE_A -ErrorAction SilentlyContinue
Remove-Item $COOKIE_B -ErrorAction SilentlyContinue

$total = $PASS + $FAIL
$color = if ($FAIL -eq 0) { "Green" } else { "Red" }

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  RESULTAT : $PASS / $total tests passes" -ForegroundColor $color
if ($FAIL -gt 0) {
    Write-Host "  $FAIL test(s) echoue(s)" -ForegroundColor Red
} else {
    Write-Host "  Tous les tests sont passes !" -ForegroundColor Green
}
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($FAIL -gt 0) { exit 1 }
