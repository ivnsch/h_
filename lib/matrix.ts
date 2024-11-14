import { mat4, vec3 } from "wgpu-matrix";

export function getTransformationMatrix(
  canvas: any,
  movX: number,
  movY: number,
  movZ: number,
  rotX: number,
  rotY: number,
  rotZ: number
) {
  const aspect = canvas.width / canvas.height;
  //   const projectionMatrix = mat4.perspective(
  //     (2 * Math.PI) / 5,
  //     aspect,
  //     1,
  //     100.0
  //   );
  const projectionMatrix = mat4.identity();
  //   const modelViewProjectionMatrix = mat4.create();
  const modelViewProjectionMatrix = mat4.identity();

  const viewMatrix = mat4.identity();
  //   const now = Date.now() / 1000;
  //   mat4.rotate(
  //     viewMatrix,
  //     vec3.fromValues(Math.sin(now), Math.cos(now), 0),
  //     1,
  //     viewMatrix
  //   );
  //   mat4.translate(viewMatrix, vec3.fromValues(movX, movY, movZ), viewMatrix);

  mat4.rotate(viewMatrix, vec3.fromValues(1, 0, 0), rotX, viewMatrix);
  mat4.rotate(viewMatrix, vec3.fromValues(0, 1, 0), rotY, viewMatrix);
  mat4.rotate(viewMatrix, vec3.fromValues(0, 0, 1), rotZ, viewMatrix);

  mat4.translate(viewMatrix, vec3.fromValues(0, 0, -10), viewMatrix);

  mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

  return modelViewProjectionMatrix;
}
