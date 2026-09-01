!include LogicLib.nsh

!define JARVIS_ALPHA_INSTALLER_STATE_KEY "Software\Jarvis-K\Alpha\InstallerState"
!define JARVIS_ALPHA_INSTALLER_STATE_PARENT_KEY "Software\Jarvis-K\Alpha"
!define JARVIS_ALPHA_INSTALLER_STATE_SUBKEY "InstallerState"
!define JARVIS_ALPHA_INSTALLER_SCHEMA_VERSION 1
!define JARVIS_ALPHA_RELEASE_ORDINAL 6
!define JARVIS_ALPHA_INSTALLED_VERSION "0.1.0-alpha.6"
!define JARVIS_ALPHA_APP_ID "com.jarvis-k.desktop.alpha"
!define JARVIS_ALPHA_CHANNEL "alpha"
!define JARVIS_ALPHA_DOWNGRADE_EXIT_CODE 1638
!define JARVIS_ALPHA_MARKER_FAILURE_EXIT_CODE 1603

!macro JarvisAlphaBlockInstall MESSAGE
  SetErrorLevel ${JARVIS_ALPHA_DOWNGRADE_EXIT_CODE}
  ${IfNot} ${Silent}
    MessageBox MB_ICONSTOP|MB_OK "${MESSAGE}"
  ${EndIf}
  Quit
!macroend

!macro JarvisAlphaBlockMarkerFailure MESSAGE
  SetErrorLevel ${JARVIS_ALPHA_MARKER_FAILURE_EXIT_CODE}
  ${IfNot} ${Silent}
    MessageBox MB_ICONSTOP|MB_OK "${MESSAGE}"
  ${EndIf}
  Abort "${MESSAGE}"
!macroend

!macro JarvisAlphaAllowBootstrapVersion VERSION DISPLAY_NAME
  ${If} "${VERSION}" == "0.1.0-alpha.4"
  ${AndIf} "${DISPLAY_NAME}" == "Jarvis-K Alpha 0.1.0-alpha.4"
    Goto jarvis_alpha_policy_allowed
  ${EndIf}
  ${If} "${VERSION}" == "0.1.0-alpha.5"
  ${AndIf} "${DISPLAY_NAME}" == "Jarvis-K Alpha 0.1.0-alpha.5"
    Goto jarvis_alpha_policy_allowed
  ${EndIf}
!macroend

!macro customInit
  StrCpy $R8 "0"
  StrCpy $R7 0
  ${Do}
    ClearErrors
    EnumRegKey $R9 HKCU "${JARVIS_ALPHA_INSTALLER_STATE_PARENT_KEY}" $R7
    ${If} ${Errors}
      ${ExitDo}
    ${EndIf}
    ${If} "$R9" == "${JARVIS_ALPHA_INSTALLER_STATE_SUBKEY}"
      StrCpy $R8 "1"
      ${ExitDo}
    ${EndIf}
    IntOp $R7 $R7 + 1
  ${Loop}

  ${If} "$R8" == "0"
    ClearErrors
    ReadRegStr $R0 HKCU "${UNINSTALL_REGISTRY_KEY}" "DisplayVersion"
    ${If} ${Errors}
      IfFileExists "$INSTDIR\resources\app\package.json" 0 jarvis_alpha_policy_allowed
      !insertmacro JarvisAlphaBlockInstall "A newer or unknown version of Jarvis-K Alpha is already installed. Install the latest Alpha build instead."
    ${EndIf}
    ClearErrors
    ReadRegStr $R1 HKCU "${UNINSTALL_REGISTRY_KEY}" "DisplayName"
    ${If} ${Errors}
      IfFileExists "$INSTDIR\resources\app\package.json" 0 jarvis_alpha_policy_allowed
      !insertmacro JarvisAlphaBlockInstall "A newer or unknown version of Jarvis-K Alpha is already installed. Install the latest Alpha build instead."
    ${EndIf}

    !insertmacro JarvisAlphaAllowBootstrapVersion "$R0" "$R1"
    !insertmacro JarvisAlphaBlockInstall "A newer or unknown version of Jarvis-K Alpha is already installed. Install the latest Alpha build instead."
  ${EndIf}

  ClearErrors
  ReadRegDWORD $R0 HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "schemaVersion"
  ${If} ${Errors}
    !insertmacro JarvisAlphaBlockInstall "A newer or unknown version of Jarvis-K Alpha is already installed. Install the latest Alpha build instead."
  ${EndIf}
  IntCmp $R0 ${JARVIS_ALPHA_INSTALLER_SCHEMA_VERSION} 0 jarvis_alpha_policy_block jarvis_alpha_policy_block

  ClearErrors
  ReadRegDWORD $R1 HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "installedReleaseOrdinal"
  ${If} ${Errors}
    !insertmacro JarvisAlphaBlockInstall "A newer or unknown version of Jarvis-K Alpha is already installed. Install the latest Alpha build instead."
  ${EndIf}

  ClearErrors
  ReadRegStr $R2 HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "installedVersion"
  ${If} ${Errors}
    !insertmacro JarvisAlphaBlockInstall "A newer or unknown version of Jarvis-K Alpha is already installed. Install the latest Alpha build instead."
  ${EndIf}
  ${If} "$R2" == ""
    !insertmacro JarvisAlphaBlockInstall "A newer or unknown version of Jarvis-K Alpha is already installed. Install the latest Alpha build instead."
  ${EndIf}

  ClearErrors
  ReadRegStr $R3 HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "appId"
  ${If} ${Errors}
    !insertmacro JarvisAlphaBlockInstall "A newer or unknown version of Jarvis-K Alpha is already installed. Install the latest Alpha build instead."
  ${EndIf}
  ${If} "$R3" != "${JARVIS_ALPHA_APP_ID}"
    !insertmacro JarvisAlphaBlockInstall "A newer or unknown version of Jarvis-K Alpha is already installed. Install the latest Alpha build instead."
  ${EndIf}

  ClearErrors
  ReadRegStr $R4 HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "channel"
  ${If} ${Errors}
    !insertmacro JarvisAlphaBlockInstall "A newer or unknown version of Jarvis-K Alpha is already installed. Install the latest Alpha build instead."
  ${EndIf}
  ${If} "$R4" != "${JARVIS_ALPHA_CHANNEL}"
    !insertmacro JarvisAlphaBlockInstall "A newer or unknown version of Jarvis-K Alpha is already installed. Install the latest Alpha build instead."
  ${EndIf}

  IntCmp $R1 ${JARVIS_ALPHA_RELEASE_ORDINAL} jarvis_alpha_policy_allowed jarvis_alpha_policy_allowed jarvis_alpha_policy_block

jarvis_alpha_policy_block:
  !insertmacro JarvisAlphaBlockInstall "A newer version of Jarvis-K Alpha is already installed. Install the latest Alpha build instead."

jarvis_alpha_policy_allowed:
!macroend

!macro customInstall
  WriteRegDWORD HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "schemaVersion" ${JARVIS_ALPHA_INSTALLER_SCHEMA_VERSION}
  WriteRegDWORD HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "installedReleaseOrdinal" ${JARVIS_ALPHA_RELEASE_ORDINAL}
  WriteRegStr HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "installedVersion" "${JARVIS_ALPHA_INSTALLED_VERSION}"
  WriteRegStr HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "appId" "${JARVIS_ALPHA_APP_ID}"
  WriteRegStr HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "channel" "${JARVIS_ALPHA_CHANNEL}"

  ClearErrors
  ReadRegDWORD $R0 HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "schemaVersion"
  ${If} ${Errors}
    !insertmacro JarvisAlphaBlockMarkerFailure "Jarvis-K Alpha installer state could not be verified."
  ${EndIf}
  IntCmp $R0 ${JARVIS_ALPHA_INSTALLER_SCHEMA_VERSION} 0 jarvis_alpha_marker_failed jarvis_alpha_marker_failed

  ClearErrors
  ReadRegDWORD $R1 HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "installedReleaseOrdinal"
  ${If} ${Errors}
    !insertmacro JarvisAlphaBlockMarkerFailure "Jarvis-K Alpha installer state could not be verified."
  ${EndIf}
  IntCmp $R1 ${JARVIS_ALPHA_RELEASE_ORDINAL} 0 jarvis_alpha_marker_failed jarvis_alpha_marker_failed

  ClearErrors
  ReadRegStr $R2 HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "installedVersion"
  ${If} ${Errors}
    !insertmacro JarvisAlphaBlockMarkerFailure "Jarvis-K Alpha installer state could not be verified."
  ${EndIf}
  ${If} "$R2" != "${JARVIS_ALPHA_INSTALLED_VERSION}"
    Goto jarvis_alpha_marker_failed
  ${EndIf}

  ClearErrors
  ReadRegStr $R3 HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "appId"
  ${If} ${Errors}
    !insertmacro JarvisAlphaBlockMarkerFailure "Jarvis-K Alpha installer state could not be verified."
  ${EndIf}
  ${If} "$R3" != "${JARVIS_ALPHA_APP_ID}"
    Goto jarvis_alpha_marker_failed
  ${EndIf}

  ClearErrors
  ReadRegStr $R4 HKCU "${JARVIS_ALPHA_INSTALLER_STATE_KEY}" "channel"
  ${If} ${Errors}
    !insertmacro JarvisAlphaBlockMarkerFailure "Jarvis-K Alpha installer state could not be verified."
  ${EndIf}
  ${If} "$R4" != "${JARVIS_ALPHA_CHANNEL}"
    Goto jarvis_alpha_marker_failed
  ${EndIf}
  Goto jarvis_alpha_marker_verified

jarvis_alpha_marker_failed:
  !insertmacro JarvisAlphaBlockMarkerFailure "Jarvis-K Alpha installer state could not be verified."

jarvis_alpha_marker_verified:
!macroend

!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Jarvis-K Alpha"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.jarvis-k.desktop.alpha"
!macroend
