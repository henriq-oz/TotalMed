```powershell
Clear-Host

Write-Output ""
Write-Output "================================="
Write-Output "      SETUP DO PROJETO"
Write-Output "================================="
Write-Output ""

# =================================
# Perguntar se deseja instalar dependencias
# =================================

Write-Output "Deseja instalar/atualizar as dependencias do npm?"
Write-Output ""
Write-Output "[S] Sim"
Write-Output "[N] Nao, pular instalacoes"
Write-Output ""

$opcaoNpm = Read-Host "Escolha uma opcao"

if ($opcaoNpm -match "^[Ss]$") {

    # =================================
    # Instalar dependencias
    # =================================

    Write-Output ""
    Write-Output "Instalando dependencias..."
    Write-Output ""

    npm install
    npm install -g npm@12.0.2
    npm install react-router-dom@latest
    npm install json-server@latest --save-dev
    npm install concurrently@latest --save-dev

    Write-Output ""
    Write-Output "Dependencias instaladas!"
    Write-Output ""
}
else {
    Write-Output ""
    Write-Output "Instalacao das dependencias ignorada."
    Write-Output ""
}

# =================================
# Ativar modo escuro do Windows
# =================================

$personalizePath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"
$appsTheme = Get-ItemProperty -Path $personalizePath -Name AppsUseLightTheme -ErrorAction SilentlyContinue
$systemTheme = Get-ItemProperty -Path $personalizePath -Name SystemUsesLightTheme -ErrorAction SilentlyContinue

$modoEscuroJaAtivo = ($appsTheme -and $appsTheme.AppsUseLightTheme -eq 0) -and
                     ($systemTheme -and $systemTheme.SystemUsesLightTheme -eq 0)

if ($modoEscuroJaAtivo) {
    Write-Output "Modo escuro ja esta ativo, pulando esta etapa..."
    Write-Output ""
}
else {
    Write-Output "Ativando modo escuro do Windows..."
    Write-Output ""

    Set-ItemProperty `
    -Path $personalizePath `
    -Name AppsUseLightTheme `
    -Value 0

    Set-ItemProperty `
    -Path $personalizePath `
    -Name SystemUsesLightTheme `
    -Value 0

    # Reiniciar explorer
    Stop-Process -Name explorer -Force
    Start-Process explorer

    Write-Output "Modo escuro ativado!"
    Write-Output ""
}

# =================================
# Instalar extensoes VS Code
# =================================

Write-Output "Instalando extensoes VS Code..."
Write-Output ""

code --install-extension PKief.material-icon-theme
code --install-extension unthrottled.doki-theme
code --install-extension esbenp.prettier-vscode
code --install-extension anthropic.claude-code

Write-Output ""
Write-Output "Extensoes instaladas!"
Write-Output ""

# =================================
# Abrir apenas o VS Code
# =================================

Write-Output "Abrindo VS Code..."
Write-Output ""

code -n

Write-Output ""
Write-Output "================================="
Write-Output "      SETUP CONCLUIDO!"
Write-Output "================================="
Write-Output ""

Pause
```
