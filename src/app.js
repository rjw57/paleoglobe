import $ from "jquery"
import THREE from "three"
import createOrbitControls from "three-orbit-controls"

let OrbitControls = createOrbitControls(THREE);

// Process map images
let maps = require("json!./mapimages/index.json").maps.map(entry => {
  let url = require("file!./mapimages/" + entry.image);
  return { ma: entry.ma, url } ;
});

// Sort maps by ma
maps = maps.sort((a, b) => a.ma - b.ma);

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();

let globeGeometry = new THREE.SphereGeometry(1, 64, 32);
let globeMaterial = new THREE.ShaderMaterial({
  uniforms: {
    leftTex: { type: "t", value: null },
    rightTex: { type: "t", value: null },
    alpha: { type: "f", value: 0 },
  },
  vertexShader: require("raw!./shader/globe_vertex.glsl"),
  fragmentShader: require("raw!./shader/globe_fragment.glsl")
});
let globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

globe.rotation.z = 23 * 2 * Math.PI / 360;

let axis = new THREE.ArrowHelper(
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1.2, 0),
  2.4, 0xcccccc, 0.05, 0.025
);
globe.add(axis);

camera.position.set(0, 0, -4);
camera.lookAt(new THREE.Vector3());
let controls = new OrbitControls(camera, renderer.domElement);

let guiState = {
  millionYearsAgo: 0,
};

$('#maInput').on('change input', evt => {
  guiState.millionYearsAgo = evt.target.value;
}).change();

// Locate map entry given Ma via binary search
function mapFromMa(ma) {
  let maxMa = maps[maps.length - 1].ma, minMa = maps[0].ma;
  if(ma <= minMa) { return { left: maps[0], right: maps[0], alpha: 0 }; }
  if(ma >= maxMa) { return {
    left: maps[maps.length - 1], right: maps[maps.length - 1], alpha: 1 };
  }

  let searchLeft = 0, searchRight = maps.length - 1;
  while(searchRight - searchLeft > 1) {
    let searchMid = Math.floor(0.5 * (searchLeft + searchRight));
    if(ma > maps[searchMid].ma) {
      searchLeft = searchMid;
    } else {
      searchRight = searchMid;
    }
  }

  // If we got here, we narrowed it down to a given entry
  let alpha = (ma - maps[searchLeft].ma) /
    (maps[searchRight].ma - maps[searchLeft].ma);
  return {
    left: maps[searchLeft], right: maps[searchRight], alpha
  };
}

// Texture cache
let textureCache = { };
let textureLoader = new THREE.TextureLoader();
function loadTexture(url) {
  return new Promise(resolve => {
    if(textureCache[url]) { resolve(textureCache[url]); }
    textureLoader.load(url, texture => {
      textureCache[url] = texture;
      resolve(texture);
    });
  });
}

// Set globe texture given Ma.
let globeLeftUrl = null, globeRightUrl = null, fetching = false;
function setMapMa(ma) {
  let { left, right, alpha } = mapFromMa(ma);
  if((left.url !== globeLeftUrl) || (right.url !== globeRightUrl)) {
    console.log(globeLeftUrl, left.url, globeRightUrl, right.url);
    if(fetching) { return; }
    fetching = true;
    Promise.all([loadTexture(left.url), loadTexture(right.url)]).then(vals => {
      let [leftTex, rightTex] = vals;
      globeMaterial.uniforms.leftTex.value = leftTex;
      globeMaterial.uniforms.rightTex.value = rightTex;
      globeLeftUrl = left.url;
      globeRightUrl = right.url;
      globeMaterial.uniforms.alpha.value = alpha;
      fetching = false;
    });
  } else {
    globeMaterial.uniforms.alpha.value = alpha;
  }
}

function renderAnimationFrame(time) {
  let w = $('#globe').innerWidth(), h = $('#globe').innerHeight();

  let { millionYearsAgo } = guiState;
  setMapMa(millionYearsAgo);
  $('#ma').text(Math.floor(millionYearsAgo));

  // Set the size of the renderer
  renderer.setSize(w, h);

  // Set camera parameters
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // Render the scene
  renderer.render(scene, camera);

  window.requestAnimationFrame(renderAnimationFrame);
}

function onReady() {
  $('#globe').append(renderer.domElement);
  requestAnimationFrame(renderAnimationFrame);
}

$(document).ready(onReady);
