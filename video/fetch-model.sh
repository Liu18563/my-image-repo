#!/usr/bin/env bash
# 下载本地中文 TTS 模型（MeloTTS 中英，MIT 许可，sherpa-onnx 导出版，约 160MB）
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p assets/tts-model
curl -sSL -o /tmp/melo.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-melo-tts-zh_en.tar.bz2
tar xjf /tmp/melo.tar.bz2 -C /tmp
cp -r /tmp/vits-melo-tts-zh_en/* assets/tts-model/
rm -f assets/tts-model/model.int8.onnx
echo "model ready: assets/tts-model"
