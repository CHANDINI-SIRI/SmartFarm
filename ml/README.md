# Disease model

SmartFarm AI uses the Hugging Face ONNX model `onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX` through Transformers.js in the browser. It is based on a MobileNetV2 fine-tuned on a PlantVillage/New Plant Diseases dataset and reports a self-reported evaluation accuracy of 0.9541 on its evaluation set. This number is not a guarantee of field accuracy. The model card explicitly states it is not a replacement for expert diagnosis.

The browser downloads the model the first time Disease AI is used and caches it according to browser/runtime behavior. No paid inference API is required.
