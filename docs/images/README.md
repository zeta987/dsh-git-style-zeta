# Screenshot provenance

Captured from the real DSH 0.1.5-rc.2 Web UI on Windows, 2026-09-18. English and Chinese are the built-in DSH interface locales. The Traditional Chinese README uses the native Chinese screenshot, as the sibling plugins do.

- plugin-list-en.png / plugin-list-zh.png: native expanded inventory card after installing this checkout using dsh plugin --profile web add in an isolated DSH_HOME. The images show enabled configuration and running state.
- system-prompt-en.png / system-prompt-zh.png: a real persisted local demo turn, with the native System prompt disclosure opened and scrolled to the plugin commit section. The PR section is farther down in the same prompt. The viewport is 1440 by 720 pixels.

The demo used an isolated workspace and DSH_HOME under the ignored .tmp/screenshots directory. A local adapter extending the installed DSH LlmAdapter returned a fixed screenshot explanation; it did not contact external models, run tools, or report invented token usage. The production plugin was loaded as an installed DSH bundle. Instruction text came from the plugin through native prompt assembly, not DOM replacement. DeepSeek routing and telemetry were disabled in this temporary host. No private sessions or credentials were copied.

Only native navigation, language selection, scrolling, viewport sizing and direct browser screenshots were used. The inventory images are element screenshots; prompt images capture the viewport. No text, styles, badges or prompt content were replaced for the images. The temporary browser and server are stopped after capture.
