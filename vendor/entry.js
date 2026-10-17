// The bundled browser runtime is committed. Rebuilding is optional.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
window.CTF3D = { THREE, GLTFLoader, RoomEnvironment };
