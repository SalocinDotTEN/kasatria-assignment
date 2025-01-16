<template>
  <v-container class="fill-height">
    <v-responsive class="align-center fill-height mx-auto">
      <div id="container" />
      <div id="menu">
        <v-btn @click="transform(targets.table, 2000)">
          TABLE
        </v-btn>
        <v-btn @click="transform(targets.sphere, 2000)">
          SPHERE
        </v-btn>
        <v-btn @click="transform(targets.helix, 2000)">
          HELIX
        </v-btn>
        <v-btn @click="transform(targets.grid, 2000)">
          GRID
        </v-btn>
        <div id="legend">
          <div class="legend-gradient">
            Net Worth Range
          </div>
          <div class="legend-labels">
            <span>&lt; RM 100k</span>
            <span>RM 100k</span>
            <span>&gt; RM 200k</span>
          </div>
        </div>
      </div>
    </v-responsive>
  </v-container>
</template>
<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import * as THREE from 'three';
import TWEEN from 'three/examples/jsm/libs/tween.module.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { JWT } from 'google-auth-library'
import { GoogleSpreadsheet } from 'google-spreadsheet'

export default defineComponent({
  setup() {
    const camera = ref<THREE.PerspectiveCamera>();
    const scene = ref(new THREE.Scene());
    const renderer = ref<CSS3DRenderer>();
    const controls = ref<TrackballControls>();

    const objects: CSS3DObject[] = [];
    const targets: { table: THREE.Object3D[]; sphere: THREE.Object3D[]; helix: THREE.Object3D[]; grid: THREE.Object3D[] } = { table: [], sphere: [], helix: [], grid: [] };

    const sheetData = ref<{ name: string; photo: string; age: string; country: string; interest: string; netWorth: number }[]>([])
    // const loading = ref(false)
    const error = ref('')

    const fetchSheetData = async () => {
      try {
        // loading.value = true
        const serviceAccountAuth = new JWT({
          email: import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT,
          key: import.meta.env.VITE_GOOGLE_API_KEY,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        })

        const dataFile = new GoogleSpreadsheet('1iCUEbsGrDXXk8lgClNpiSA6Dm8ZCLQDReIKCD4L_HCY', serviceAccountAuth)
        await dataFile.loadInfo()

        const sheet = dataFile.sheetsByIndex[0]
        if (!sheet) throw new Error('Sheet not found')

        const rows = await sheet.getRows()
        if (!rows || !rows.length) throw new Error('No data found')

        sheetData.value = rows.map(row => ({
          name: row.get('Name') || '',
          photo: row.get('Photo') || 'https://www.kasatria.com/img/favicon/favicon-32x32.png',
          age: row.get('Age') || '',
          country: row.get('Country') || '',
          interest: row.get('Interest') || '',
          netWorth: parseFloat(row.get('Net Worth').replace('$', '').replace(',', '')) || 0
        }))

        console.log('Sheet data:', sheetData.value)

        return sheetData.value
      } catch (err) {
        if (err instanceof Error) {
          error.value = err.message;
        } else {
          error.value = String(err);
        }
        console.error('Error fetching sheet data:', err)
      } finally {
        // loading.value = false
      }
    }

    onMounted(() => {
      fetchSheetData().then((data) => {
        init(data);
      }).catch((err) => {
        console.error(err)
      })
      animate();
    });

    function init(tableInput: { name: string; photo: string; age: string; country: string; interest: string; netWorth: number }[] = []) {
      camera.value = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
      camera.value.position.z = 3000;

      scene.value = new THREE.Scene();
      // Define min and max colors
      const minColour = { r: 239, g: 48, b: 34 }; // #EF3022
      const midColour = { r: 253, g: 202, b: 53 }; // #FDCA35
      const maxColour = { r: 58, g: 159, b: 72 }; // #3A9F48

      // Function to interpolate between two colors
      function interpolateColor(colour1: { r: number; g: number; b: number; }, colour2: { r: number; g: number; b: number; }, factor: number, background: boolean) {
        const result = {
          r: Math.round(colour1.r + factor * (colour2.r - colour1.r)),
          g: Math.round(colour1.g + factor * (colour2.g - colour1.g)),
          b: Math.round(colour1.b + factor * (colour2.b - colour1.b)),
        };
        if (background) {
          return `rgba(${result.r}, ${result.g}, ${result.b}, 0.5)`;
        } else {
          return `rgb(${result.r}, ${result.g}, ${result.b})`;
        }
      }

      // table
      tableInput.forEach((renderRow, i) => {

        const element = document.createElement('div');
        element.className = 'element';
        let bgColor, borderColor;
        if (renderRow.netWorth <= 100000) {
          bgColor = interpolateColor(minColour, midColour, renderRow.netWorth / 100000, true);
          borderColor = interpolateColor(minColour, midColour, renderRow.netWorth / 100000, false);
        } else if (renderRow.netWorth <= 200000) {
          bgColor = interpolateColor(midColour, maxColour, (renderRow.netWorth - 100000) / 100000, true);
          borderColor = interpolateColor(midColour, maxColour, (renderRow.netWorth - 100000) / 100000, false);
        } else {
          bgColor = `rgba(${maxColour.r}, ${maxColour.g}, ${maxColour.b}, 0.5)`;
          borderColor = `rgb(${maxColour.r}, ${maxColour.g}, ${maxColour.b})`;
        }
        // if (renderRow.netWorth <= 100000) {
        //   bgColor = 'rgba(239, 48, 34, 0.5)';
        //   borderColor = 'rgba(239, 48, 34)';
        // } else if (renderRow.netWorth < 200000) {
        //   bgColor = 'rgba(253, 202, 53, 0.5)';
        //   borderColor = 'rgba(253, 202, 53)';
        // } else {
        //   bgColor = 'rgba(58, 159, 72, 0.5)';
        //   borderColor = 'rgba(58, 159, 72)';
        // }
        element.style.backgroundColor = bgColor;
        element.style.border = '1px solid ' + borderColor;

        const country = document.createElement('div');
        country.className = 'country';
        country.textContent = renderRow.country;
        element.appendChild(country);

        const number = document.createElement('div');
        number.className = 'age';
        number.textContent = renderRow.age.toString();
        element.appendChild(number);

        const symbol = document.createElement('div');
        symbol.className = 'photo';
        symbol.innerHTML = '<img src="' + String(renderRow.photo) + '" style="width:80px; height: 80px;"/>';
        element.appendChild(symbol);

        const details = document.createElement('div');
        details.className = 'name-interest';
        details.innerHTML = '<b>' + renderRow.name + '</b><br>' + renderRow.interest;
        element.appendChild(details);

        const objectCSS = new CSS3DObject(element);
        objectCSS.position.x = Math.random() * 4000 - 2000;
        objectCSS.position.y = Math.random() * 4000 - 2000;
        objectCSS.position.z = Math.random() * 4000 - 2000;
        scene.value.add(objectCSS);

        objects.push(objectCSS);

        //Modified according to project requirement 20x10 table.
        const object = new THREE.Object3D();
        const row = Math.floor(i / 20);
        const col = i % 20;
        object.position.x = (col * 140) - 1330;
        object.position.y = - (row * 180) + 990;

        targets.table.push(object);

      })

      // sphere

      const vector = new THREE.Vector3();

      for (let i = 0, l = objects.length; i < l; i++) {

        const phi = Math.acos(- 1 + (2 * i) / l);
        const theta = Math.sqrt(l * Math.PI) * phi;

        const object = new THREE.Object3D();

        object.position.setFromSphericalCoords(800, phi, theta);

        vector.copy(object.position).multiplyScalar(2);

        object.lookAt(vector);

        targets.sphere.push(object);

      }

      // helix
      for (let i = 0, l = objects.length; i < l; i++) {
        // Helix 1
        const theta1 = i * 0.175 + Math.PI
        const y1 = -(i * 8) + 450

        const object1 = new THREE.Object3D()
        object1.position.setFromCylindricalCoords(900, theta1, y1)

        vector.x = object1.position.x * 2
        vector.y = object1.position.y
        vector.z = object1.position.z * 2

        object1.lookAt(vector)

        // Helix 2
        const theta2 = i * 0.175 + Math.PI * 2
        const y2 = -(i * 8) + 450

        const object2 = new THREE.Object3D()
        object2.position.setFromCylindricalCoords(900, theta2, y2)

        vector.x = object2.position.x * 2
        vector.y = object2.position.y
        vector.z = object2.position.z * 2

        object2.lookAt(vector)

        // Alternate between first and second helix
        targets.helix.push(i % 2 === 0 ? object1 : object2)
      }

      // grid

      for (let i = 0; i < objects.length; i++) {

        const object = new THREE.Object3D();

        object.position.x = ((i % 5) * 400) - 800;
        object.position.y = (- (Math.floor(i / 5) % 5) * 400) + 800;
        object.position.z = (Math.floor(i / 25)) * 1000 - 2000;

        targets.grid.push(object);

      }

      renderer.value = new CSS3DRenderer();
      renderer.value.setSize(window.innerWidth, window.innerHeight);
      document.getElementById('container')?.appendChild(renderer.value.domElement);

      controls.value = new TrackballControls(camera.value, renderer.value.domElement);
      controls.value.minDistance = 500;
      controls.value.maxDistance = 6000;
      controls.value.addEventListener('change', render);

      window.addEventListener('resize', onWindowResize);

      transform(targets.table, 2000);
    }

    function transform(targetsArray: THREE.Object3D[], duration: number) {
      TWEEN.removeAll();

      for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const target = targetsArray[i];

        new TWEEN.Tween(object.position)
          .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
          .easing(TWEEN.Easing.Exponential.InOut)
          .start();

        new TWEEN.Tween(object.rotation)
          .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
          .easing(TWEEN.Easing.Exponential.InOut)
          .start();
      }

      new TWEEN.Tween({})
        .to({}, duration * 2)
        .onUpdate(render)
        .start();
    }

    function onWindowResize() {
      if (camera.value && renderer.value) {
        camera.value.aspect = window.innerWidth / window.innerHeight;
        camera.value.updateProjectionMatrix();
        renderer.value.setSize(window.innerWidth, window.innerHeight);
        render();
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      TWEEN.update();
      controls.value?.update();
    }

    function render() {
      if (renderer.value && camera.value) {
        renderer.value.render(scene.value, camera.value);
      }
    }

    return {
      //loading,
      error,
      sheetData,
      transform,
      targets,
    };
  },
});
</script>
<style>
a {
  color: #8ff;
}

#menu {
  position: absolute;
  bottom: 20px;
  width: 100%;
  text-align: center;
}

.element {
  width: 120px;
  height: 160px;
  color: rgba(255, 255, 255);
  box-shadow: 0px 0px 12px rgb(255, 255, 255);
  border: 1px solid rgb(255, 255, 255);
  font-family: Helvetica, sans-serif;
  text-align: center;
  line-height: normal;
  cursor: default;
}

.element:hover {
  box-shadow: 0px 0px 12px rgba(255, 255, 255, 0.801);
  border: 1px solid rgba(255, 255, 255, 0.75);
}
.element .country {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 12px;
}

.element .age {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 12px;
}

.element .photo {
  position: absolute;
  height: 80px;
  top: 30px;
  left: 0px;
  right: 0px;
  font-size: 60px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.95);
}

.element .name-interest {
  position: absolute;
  bottom: 10px;
  left: 0px;
  right: 0px;
  font-size: 12px;
}

button {
  color: rgba(255, 255, 255, 0.75);
  background: transparent;
  outline: 1px solid rgba(255, 255, 255, 0.75);
  border: 0px;
  padding: 5px 10px;
  cursor: pointer;
}

button:hover {
  background-color: rgba(252, 252, 252, 0.5);
}

button:active {
  color: #000000;
  background-color: rgba(255, 255, 255, 0.75);
}

#legend {
  margin-top: 20px;
  text-align: center;
}

.legend-gradient {
  width: 100%;
  height: 20px;
  color: #000000;
  background: linear-gradient(to right, #EF3022, #FDCA35, #3A9F48);
  margin-bottom: 5px;
}

.legend-labels {
  display: flex;
  justify-content: space-between;
}
</style>
