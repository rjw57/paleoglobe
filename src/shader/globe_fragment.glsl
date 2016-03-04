varying vec2 texCoord;

uniform sampler2D leftTex, rightTex;
uniform float alpha;

void main() {
  vec4 left = texture2D(leftTex, texCoord);
  vec4 right = texture2D(rightTex, texCoord);
  gl_FragColor = alpha * right + (1.0 - alpha) * left;
}

// vim:filetype=c

