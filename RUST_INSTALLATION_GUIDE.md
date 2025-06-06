# 🦀 Rust Installation Guide for TerraFusion

## Quick Installation Options

### Option 1: Manual Download (Recommended)
1. Go to https://rustup.rs/
2. Download rustup-init.exe
3. Run the installer
4. Follow prompts (default options are fine)
5. Restart terminal

### Option 2: Chocolatey
```powershell
choco install rust
```

### Option 3: Scoop
```powershell
scoop install rust
```

### Option 4: Direct rustup
```powershell
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "rustup-init.exe"
.\rustup-init.exe
```

## Verification
```powershell
cargo --version
rustc --version
```

## Next Steps After Installation
```powershell
cd terrafusion_rust
cargo build --release
``` 