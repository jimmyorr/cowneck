import { getPlaneColor } from './multiplayer.js';

export function createPlane(playerUid, planeColor) {
    const planeGroup = new THREE.Group();
    planeGroup.rotation.y = 0;

    const bodyGeo = new THREE.BoxGeometry(4, 4, 16);
    const planeMat = new THREE.MeshStandardMaterial({ color: planeColor || getPlaneColor(playerUid), flatShading: true });
    const body = new THREE.Mesh(bodyGeo, planeMat);
    planeGroup.add(body);

    const windowGeo = new THREE.BoxGeometry(3, 2, 4);
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
    const cockpit = new THREE.Mesh(windowGeo, windowMat);
    cockpit.position.set(0, 2.5, -2);
    planeGroup.add(cockpit);

    const wingGeo = new THREE.BoxGeometry(30, 0.5, 4);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, flatShading: true });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0, -1);
    planeGroup.add(wings);

    const tailGeo = new THREE.BoxGeometry(10, 0.5, 3);
    const tail = new THREE.Mesh(tailGeo, wingMat);
    tail.position.set(0, 0, 7);
    planeGroup.add(tail);

    const rudderGeo = new THREE.BoxGeometry(0.5, 5, 3);
    const rudder = new THREE.Mesh(rudderGeo, planeMat);
    rudder.position.set(0, 2.5, 7);
    planeGroup.add(rudder);

    const propGroup = new THREE.Group();
    propGroup.position.set(0, 0, -8.5);
    planeGroup.add(propGroup);

    const propCenterGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
    propCenterGeo.rotateX(Math.PI / 2);
    const propCenter = new THREE.Mesh(propCenterGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
    propGroup.add(propCenter);

    const bladeGeo = new THREE.BoxGeometry(12, 0.4, 0.4);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const blade1 = new THREE.Mesh(bladeGeo, bladeMat);
    const blade2 = new THREE.Mesh(bladeGeo, bladeMat);
    blade2.rotation.z = Math.PI / 2;
    propGroup.add(blade1);
    propGroup.add(blade2);

    const pontoonGroup = new THREE.Group();
    pontoonGroup.visible = false;
    planeGroup.add(pontoonGroup);

    const pontoonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, flatShading: true });
    const pontoonGeo = new THREE.CylinderGeometry(1.5, 1.5, 18, 8);
    pontoonGeo.rotateX(Math.PI / 2);
    const pontoonNoseGeo = new THREE.ConeGeometry(1.5, 4, 8);
    pontoonNoseGeo.rotateX(Math.PI / 2);

    const pontoonL = new THREE.Group();
    const pontoonBodyL = new THREE.Mesh(pontoonGeo, pontoonMat);
    const pontoonNoseMeshL = new THREE.Mesh(pontoonNoseGeo, pontoonMat);
    pontoonNoseMeshL.position.set(0, 0, -11);
    pontoonL.add(pontoonBodyL);
    pontoonL.add(pontoonNoseMeshL);
    pontoonL.position.set(-5, -4.5, 0);
    pontoonGroup.add(pontoonL);

    const pontoonR = new THREE.Group();
    const pontoonBodyR = new THREE.Mesh(pontoonGeo, pontoonMat);
    const pontoonNoseMeshR = new THREE.Mesh(pontoonNoseGeo, pontoonMat);
    pontoonNoseMeshR.position.set(0, 0, -11);
    pontoonR.add(pontoonBodyR);
    pontoonR.add(pontoonNoseMeshR);
    pontoonR.position.set(5, -4.5, 0);
    pontoonGroup.add(pontoonR);

    const strutGeo = new THREE.CylinderGeometry(0.2, 0.2, 4.5, 4);
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const hinges = [];
    [[-5, -3], [-5, 3], [5, -3], [5, 3]].forEach(([x, z], i) => {
        const hinge = new THREE.Group();
        hinge.position.set(x, 0, z);
        const strut = new THREE.Mesh(strutGeo, strutMat);
        strut.position.set(0, -2.25, 0);
        hinge.add(strut);
        pontoonGroup.add(hinge);
        hinges.push(hinge);
    });

    // Initial folded state
    pontoonL.position.set(-5, -0.5, 0); pontoonL.rotation.z = Math.PI / 2;
    pontoonR.position.set(5, -0.5, 0); pontoonR.rotation.z = -Math.PI / 2;
    hinges[0].rotation.z = Math.PI / 2; hinges[1].rotation.z = Math.PI / 2;
    hinges[2].rotation.z = -Math.PI / 2; hinges[3].rotation.z = -Math.PI / 2;

    planeGroup.rotation.order = 'YXZ';

    const headlight = new THREE.SpotLight(0xffd1a3, 0);
    headlight.position.set(0, 0, -10);
    const headlightTarget = new THREE.Object3D();
    headlightTarget.position.set(0, -20, -100);
    planeGroup.add(headlightTarget);
    headlight.target = headlightTarget;
    headlight.angle = Math.PI / 4;
    headlight.penumbra = 1.0;
    headlight.distance = 1500;
    headlight.decay = 2.0;

    const headlightGlow = new THREE.PointLight(0xffd1a3, 0, 50);
    headlightGlow.position.set(0, 5, 0);
    planeGroup.add(headlightGlow);
    planeGroup.add(headlight);

    planeGroup.position.set(0, 200, 0);

    return {
        group: planeGroup,
        material: planeMat,
        headlight,
        headlightGlow,
        propeller: propGroup,
        pontoonGroup,
        pontoons: [pontoonL, pontoonR],
        hinges
    };
}
