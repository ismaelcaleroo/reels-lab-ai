#!/usr/bin/env bash
# Instala dependencias y descarga el modelo de voz Kokoro (Apache-2.0), con salida de duraciones.
set -euo pipefail
cd "$(dirname "$0")/.."
npm install
python3 -m venv .venv
.venv/bin/pip install -q kokoro-onnx soundfile numpy scipy onnx
mkdir -p models
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f models/voices-v1.0.bin ] || curl -L -o models/voices-v1.0.bin "$BASE/voices-v1.0.bin"
[ -f models/kokoro-v1.0.onnx ] || curl -L -o models/kokoro-v1.0.onnx "$BASE/kokoro-v1.0.onnx"
[ -f models/kokoro-v1.0-timed.onnx ] || .venv/bin/python - <<'PY'
import onnx
m = onnx.load('models/kokoro-v1.0.onnx')
m.graph.node.append(onnx.helper.make_node('Cast', ['/encoder/Clip_output_0'], ['duration'], to=onnx.TensorProto.INT64))
m.graph.output.append(onnx.helper.make_tensor_value_info('duration', onnx.TensorProto.INT64, None))
onnx.save(m, 'models/kokoro-v1.0-timed.onnx')
PY
echo "Listo. Prueba: npm run reel -- reels/procrastination"
