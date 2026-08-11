{
  lib,
  stdenv,
  pkgs,
  ...
}:
let
  nodejs = pkgs.nodejs_20;
in
stdenv.mkDerivation {
  pname = "qzonearchive";
  version = "1.0.3";

  src = lib.cleanSource ../.;

  nativeBuildInputs = with pkgs; [
    nodejs
    pkg-config
    cmake
    gcc
    gnumake
    rustc
    cargo
    perl
    wrapGAppsHook3
  ];

  buildInputs = with pkgs; [
    glib
    gtk3
    webkitgtk_4_1
    libsoup_3
    openssl
    patchelf
    sqlite
  ];

  configurePhase = ''
    npm ci
  '';

  buildPhase = ''
    npm run build
    npx tauri build --no-bundle --ci
  '';

  installPhase = ''
    runHook preInstall

    install -Dm755 src-tauri/target/release/qzonearchive "$out/bin/qzonearchive"

    runHook postInstall
  '';
}
