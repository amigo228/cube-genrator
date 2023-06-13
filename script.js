const vertexShaderTxt = `
    precision mediump float;

    attribute vec3 vertPosition;
    attribute vec3 vertColor;

    varying vec3 fragColor;

    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;

    void main()
    {
        fragColor = vertColor;
        gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
    }
`;

const fragmentShaderTxt = `
    precision mediump float;

    varying vec3 fragColor;

    void main()
    {
        gl_FragColor = vec4(fragColor, 1.0);
    }
`;

const mat4 = glMatrix.mat4;

const generateCube = function (sideLength, vertexColors) {
    const halfLength = sideLength / 2;

    const vertices = [
        // Top
        -halfLength, halfLength, -halfLength,
        halfLength, halfLength, -halfLength,
        halfLength, halfLength, halfLength,
        -halfLength, halfLength, halfLength,

        // Left
        -halfLength, halfLength, halfLength,
        -halfLength, -halfLength, halfLength,
        -halfLength, -halfLength, -halfLength,
        -halfLength, halfLength, -halfLength,

        // Right
        halfLength, halfLength, halfLength,
        halfLength, -halfLength, halfLength,
        halfLength, -halfLength, -halfLength,
        halfLength, halfLength, -halfLength,

        // Front
        halfLength, halfLength, halfLength,
        halfLength, -halfLength, halfLength,
        -halfLength, -halfLength, halfLength,
        -halfLength, halfLength, halfLength,

        // Back
        halfLength, halfLength, -halfLength,
        halfLength, -halfLength, -halfLength,
        -halfLength, -halfLength, -halfLength,
        -halfLength, halfLength, -halfLength,

        // Bottom
        -halfLength, -halfLength, -halfLength,
        halfLength, -halfLength, -halfLength,
        halfLength, -halfLength, halfLength,
        -halfLength, -halfLength, halfLength,
    ];

    const boxVertices = [];
    for (let i = 0; i < vertices.length; i += 3) {
        const vertex = vertices.slice(i, i + 3);
        const colorIndex = i / 3 % vertexColors.length;
        const color = vertexColors[colorIndex];
        boxVertices.push(...vertex, ...color);
    }

    const boxIndices = [
        // Top
        0, 1, 2,
        0, 2, 3,

        // Left
        4, 5, 6,
        6, 7, 4,

        // Right
        8, 9, 10,
        8, 10, 11,

        // Front
        12, 13, 14,
        12, 14, 15,

        // Back
        16, 17, 18,
        16, 18, 19,

        // Bottom
        20, 21, 22,
        20, 22, 23,
    ];

    return {
        vertices: boxVertices,
        indices: boxIndices,
    };
};
function calculateX(sideLength, vertexIndex) {
    const xCoordinates = [-1, -1, 1, 1, -1, -1, 1, 1];
    return xCoordinates[vertexIndex] * (sideLength / 2);
}

function calculateY(sideLength, vertexIndex) {
    const yCoordinates = [1, 1, 1, 1, -1, -1, -1, -1];
    return yCoordinates[vertexIndex] * (sideLength / 2);
}

function calculateZ(sideLength, vertexIndex) {
    const zCoordinates = [-1, 1, 1, -1, -1, 1, 1, -1];
    return zCoordinates[vertexIndex] * (sideLength / 2);
}

const Triangle = function () {
    const canvas = document.getElementById("main-canvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert('no webgl');
    }

    gl.clearColor(0.5, 0.4, 0.7, 1.0);   // R,G,B, opacity
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderTxt);
    gl.shaderSource(fragmentShader, fragmentShaderTxt);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
    }
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);

    gl.validateProgram(program);

    const box = generateCube(2, [
        [0.7, 0.7, 0.7],   // Top
        [0.75, 0.25, 0.5], // Left
        [0.25, 0.25, 0.75],// Right
        [1.0, 0.0, 0.15],  // Front
        [0.0, 1.0, 0.15],  // Back
        [0.0, 0.0, 0.0],   // Bottom
    ]);

    const boxVertices = box.vertices;
    const boxIndices = box.indices;
    const boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    const cubeVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    const posAttrLocation = gl.getAttribLocation(program, 'vertPosition');
    const colorAttrLocation = gl.getAttribLocation(program, 'vertColor');
    gl.vertexAttribPointer(
        posAttrLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT,
        0,
    );

    gl.vertexAttribPointer(
        colorAttrLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT,
    );

    gl.enableVertexAttribArray(posAttrLocation);
    gl.enableVertexAttribArray(colorAttrLocation);

    gl.useProgram(program);

    const matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    const matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    const matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

    let worldMatrix = mat4.create();
    let viewMatrix = mat4.create();
    let projMatrix = mat4.create();
    mat4.identity(worldMatrix);
    mat4.lookAt(viewMatrix, [0, 0, -6], [0, 0, 0], [0, 1, 0]);
    mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

    let identityMatrix = mat4.create();
    let angle = 0
    const loop = function () {
        angle = performance.now() / 1000 / 8 * 2 * Math.PI;

        mat4.rotate(worldMatrix, identityMatrix, angle, [2, 1, 0]);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
};

Triangle();

