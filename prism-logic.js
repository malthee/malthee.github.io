/**
 * Little prism project. Not intended to be 100% physically accurate ofc. physics are hard.
 * Thanks to https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/ for svg dragging mechanics
 * and to Justin C. Rounds for the line intersection algorithm.
 * Lastly thanks to Willebrord Snellius for Snell's law.
 */

/**
 * A equilateral triangle with 60° angles. 
 */
class Prism {
    #prismElement = document.getElementById('prism-glass');

    /**
     * 
     * @param {number} topX 
     * @param {number} topY 
     * @param {number} height 
     * @param {string} id html id 
     */
    constructor(topX, topY, height) {
        this.topX = topX;
        this.topY = topY;
        this.height = height;
    }

    /**
     * Gets the angle of the prism in rad (60deg).
     */
    static get angle() {
        return Math.PI / 3;
    }

    /**
     * Gets the Math.tan() of the prism angle
     */
    static get angleTan() {
        return Math.tan(Math.PI / 3);
    }

    /**
     * Gets the bottom y position of the prism.
     */
    get bottomY() {
        return this.topY + this.height;
    }

    /**
    * Gets the bottom right position of the prism.
    */
    get bottomRightPos() {
        return { x: this.topX + this.height / Prism.angleTan, y: this.topY + this.height }
    }

    /**
    * Gets the bottom left position of the prism.
    */
    get bottomLeftPos() {
        return { x: this.topX - this.height / Prism.angleTan, y: this.topY + this.height }
    }

    /**
     * Gets the closest x position on the left side of the prism parallel to yPos.
     * @param {number} yPos 
     * @returns {number} x position on the left side of the prism or -1 if doesn't exist.
     */
    getXPosOnLeftSide(yPos) {
        return yPos > this.bottomY || yPos < this.topY ?
            -1 : this.topX - ((yPos - this.topY) / Prism.angleTan);
    }

    /**
     * Initially draws the prism by setting its polygon points.
     */
    draw() {
        this.#prismElement.setAttribute('points', `
            ${this.bottomLeftPos.x},${this.bottomLeftPos.y} 
            ${this.topX},${this.topY} 
            ${this.bottomRightPos.x},${this.bottomRightPos.y}`);
    }
}

/**
 * White light going into a prism.
 */
class IncidentRay {
    #rayElement = document.getElementById('incident-ray');
    #startElement = document.getElementById('incident-start');
    #endElement = document.getElementById('incident-end');
    #prism

    /**
     * 
     * @param {Prism} prism 
     */
    constructor(prism) {
        this.#prism = prism;
    }

    /**
     * Gets the incident angle of the incident ray in rad.
     */
    get incidentAngle() {
        let y1 = parseFloat(this.#rayElement.getAttribute('y1'));
        let y2 = parseFloat(this.#rayElement.getAttribute('y2'));
        let x1 = parseFloat(this.#rayElement.getAttribute('x1'));
        let x2 = parseFloat(this.#rayElement.getAttribute('x2'));

        // Angle of line is calculated through its slope defined by the two points. 
        let baseAngle = Math.atan((y2 - y1) / (x2 - x1));
        return baseAngle * -1 + Math.PI / 6; // To get the incident angle along the prism normal 30 degrees is added.
    }

    get startingPos() {
        return {
            x: parseFloat(this.#rayElement.getAttribute('x1')),
            y: parseFloat(this.#rayElement.getAttribute('y1'))
        }
    }

    get endPos() {
        return {
            x: parseFloat(this.#rayElement.getAttribute('x2')),
            y: parseFloat(this.#rayElement.getAttribute('y2'))
        }
    }

    get beamWidth() {
        return this.#rayElement.getAttribute('stroke-width');
    }

    /**
     * Tries to move the starting point of the incident ray.
     * @param {number} x 
     * @param {number} y 
     * @returns {bool} if position change was performed
     */
    tryMoveStart(x, y) {
        // Start has to be in view, above prism bottom, to the left side of the prism and end.
        if (y < this.#prism.topY && x >= this.#prism.topX ||
            // Has to be left of end.
            x >= parseFloat(this.#rayElement.getAttribute('x2')) - this.beamWidth ||
            // Also left of prism.
            y >= this.#prism.topY && y < this.#prism.bottomY && x >= this.#prism.getXPosOnLeftSide(y) ||
            // Can be below prism but has to be on the left side.
            y >= this.#prism.bottomY && x >= this.#prism.bottomLeftPos.x - ((this.#prism.topX - this.#prism.bottomLeftPos.x) / (this.#prism.bottomY - this.#prism.topY)) * (y - this.#prism.bottomY)) {
            return false;
        }

        this.#startElement.setAttribute('cx', x);
        this.#startElement.setAttribute('cy', y);
        this.#rayElement.setAttribute('x1', x);
        this.#rayElement.setAttribute('y1', y);
        return true;
    }

    // TODO angle check other side still right
    // check if move possib with start and end

    /**
     * Tries to move the end of the incident ray.
     * @param {number} y 
     * @returns {bool} if position change was performed
     */
    tryMoveEnd(y) {
        // End moves alongside left of prism.
        // If mouse is higher up or lower than the prism, lock end to nearest point.
        let newY = y <= this.#prism.topY + this.beamWidth / 2 ? this.#prism.topY + this.beamWidth / 2 :
            y >= this.#prism.bottomY - this.beamWidth / 2 ? this.#prism.bottomY - this.beamWidth / 2 : y;
        let x = this.#prism.getXPosOnLeftSide(newY);

        // TODO do not allow start before end mby max angle
        if (this.#prism.getXPosOnLeftSide(newY) <= parseFloat(this.#startElement.getAttribute('cx')) + this.beamWidth || this.#prism.getXPosOnLeftSide(y) === -1) {
            return false;
        }

        this.#endElement.setAttribute('cx', x);
        this.#endElement.setAttribute('cy', newY);
        this.#rayElement.setAttribute('x2', x);
        this.#rayElement.setAttribute('y2', newY);
        return true;
    }

    /**
     * Tries to move the whole incident ray on the y position.
     * @param {number} y1
     * @param {number} y2
     * @returns {bool} if position change was performed
     */
    tryMoveRay(y1, y2) {
        if (!this.tryMoveEnd(y2)) {
            return false;
        }

        this.#startElement.setAttribute('cy', y1);
        this.#rayElement.setAttribute('y1', y1);
        this.#rayElement.setAttribute('y2', y2);
        return true;
    }

    /**
     * Initially draws the incident ray center of the prism. 
     */
    draw() {
        let startPosY = this.#prism.topY + this.#prism.height;
        let endPosY = this.#prism.topY + this.#prism.height / 2;
        let startPosX = this.#startElement.getAttribute('rx');
        let endPosX = this.#prism.getXPosOnLeftSide(endPosY);

        this.#startElement.setAttribute('cx', startPosX);
        this.#startElement.setAttribute('cy', startPosY);
        this.#rayElement.setAttribute('x1', startPosX);
        this.#rayElement.setAttribute('y1', startPosY);
        this.#rayElement.setAttribute('x2', endPosX);
        this.#rayElement.setAttribute('y2', endPosY);
        this.#endElement.setAttribute('cx', endPosX);
        this.#endElement.setAttribute('cy', endPosY);
    }
}

/**
 * The reaction of white light entering a prism.
 */
class Refraction {
    #refractions = [document.getElementById('refraction-red'),
    document.getElementById('refraction-orange'),
    document.getElementById('refraction-yellow'),
    document.getElementById('refraction-green'),
    document.getElementById('refraction-blue'),
    document.getElementById('refraction-indigo'),
    document.getElementById('refraction-violet')]
    #refractionGroup = document.getElementById('prism-refraction');

    #incidentRay
    #prism

    /**
     * 
     * @param {IncidentRay} incidentRay 
     * @param {Prism} prism 
     */
    constructor(incidentRay, prism) {
        this.#incidentRay = incidentRay;
        this.#prism = prism;
    }

    // Constants taken from https://en.wikipedia.org/wiki/Cauchy%27s_equation
    /**
     * Material constant A of flint glass.
     */
    static get prismAConstant() {
        return 1.67;
    }

    /**
     * Material constant b of flint glass.
     */
    static get prismBConstant() {
        return 0.00743;
    }

    // Calculating n in snell's law: n = A + b/wv^2
    /**
     * n value of red light entering the prism. 
     */
    static get nRedPrism() {
        return Refraction.prismAConstant + (Refraction.prismBConstant / Math.pow(0.68, 2));
    }

    /**
    * n value of violet light entering the prism. 
    */
    static get nVioletPrism() {
        return Refraction.prismAConstant + (Refraction.prismBConstant / Math.pow(0.41, 2));
    }

    draw() {
        let rayEnd = this.#incidentRay.endPos;
        let halfBeamWidth = this.#incidentRay.beamWidth / 2;
        // Since the beam is thick the top part will be used to calculate red, bottom part violet.
        let beamStartY = rayEnd.y - halfBeamWidth, beamEndY = rayEnd.y + halfBeamWidth;
        let refractionStart = { x: this.#prism.getXPosOnLeftSide(beamStartY), y: beamStartY },
            refractionEnd = { x: this.#prism.getXPosOnLeftSide(beamEndY), y: beamEndY };

        // Refraction inside of the prism.
        let redPrismEnd = this.#findPrismExitPoint(refractionStart, Refraction.nRedPrism),
            violetPrismEnd = this.#findPrismExitPoint(refractionEnd, Refraction.nVioletPrism);
        let refractStartDeviationX = (refractionEnd.x - refractionStart.x) / 7,
            refractStartDeviationY = (refractionEnd.y - refractionStart.y) / 7,
            refractEndDeviationX = (violetPrismEnd.x - redPrismEnd.x) / 7,
            refractEndDeviationY = (violetPrismEnd.y - redPrismEnd.y) / 7;

        // Refraction outside of the prism ends at width of the viewport.
        let endX = this.#refractionGroup.viewportElement.viewBox.baseVal.width;
        let redEnd = { x: endX, y: redPrismEnd.y + (endX - redPrismEnd.x) * Math.tan(this.#outAngleNormalized(Refraction.nRedPrism)) },
            violetEnd = { x: endX, y: violetPrismEnd.y + (endX - violetPrismEnd.x) * Math.tan(this.#outAngleNormalized(Refraction.nVioletPrism)) }
        let endDeviationY = (violetEnd.y - redEnd.y) / 7;

        for (let i = 0; i < this.#refractions.length; i++) {
            const refraction = this.#refractions[i];
            // Interpolating points from red to violet. Points start at the incident ray, going to the other prism side, to the end of the viewport and back.
            refraction.setAttribute('points', `${refractionStart.x + refractStartDeviationX * i},${refractionStart.y + refractStartDeviationY * i} 
            ${redPrismEnd.x + refractEndDeviationX * i},${redPrismEnd.y + refractEndDeviationY * i} 
            ${endX},${redEnd.y + endDeviationY * i} 
            ${endX},${redEnd.y + endDeviationY * (i + 1)} 
            ${redPrismEnd.x + refractEndDeviationX * (i + 1)},${redPrismEnd.y + refractEndDeviationY * (i + 1)} 
            ${refractionStart.x + refractStartDeviationX * (i + 1)},${refractionStart.y + refractStartDeviationY * (i + 1)}`);
        }
    }

    /**
     * Gets the out angle for a specific refraction index normalized for display angle.
     * @param {number} n refraction index
     */
    #outAngleNormalized(n) {
        let sinIncident = Math.sin(this.#incidentRay.incidentAngle);
        let angle = (Math.sqrt(3) / 2)
            * Math.sqrt(Math.pow(n, 2) - Math.pow(sinIncident, 2))
            - sinIncident / 2;
        return angle - Math.PI / 6; // Adding 30 deg to inverse to get angle on canvas.
    }

    /**
     * Gets the angle of refraction for a specific refraction index normalized for display angle.
     * @param {number} n refraction index
     */
    #refractionAngleNormalized(n) {
        return Math.asin(Math.sin(this.#incidentRay.incidentAngle) / n)
            * -1 + Math.PI / 6;
    }

    /**
     * Finds the point of intersection of the refracted ray with the right side of a prism if exists.
     * @param {{x, y}} rayStart start of refraction
     * @param {number} n refraction index 
     * @returns {{x, y, onPrism}} position of intersection and if it is on the prism side
     */
    #findPrismExitPoint(rayStart, n) {
        // Justin C. Rounds algorithm for finding intersection of two lines
        // If the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) 
        let rightSideStart = { x: this.#prism.topX, y: this.#prism.topY },
            rightSideEnd = this.#prism.bottomRightPos,
            rayTargetDirection = { x: rayStart.x + 1, y: rayStart.y + Math.tan(this.#refractionAngleNormalized(n)) };

        let denominator, a, b, numerator1, numerator2, result = {
            x: null,
            y: null,
            onPrism: false
        };

        denominator = ((rightSideEnd.y - rightSideStart.y) * (rayTargetDirection.x - rayStart.x))
            - ((rightSideEnd.x - rightSideStart.x) * (rayTargetDirection.y - rayStart.y));
        if (denominator == 0) {
            return result;
        }

        a = rayStart.y - rightSideStart.y;
        b = rayStart.x - rightSideStart.x;
        numerator1 = ((rightSideEnd.x - rightSideStart.x) * a) - ((rightSideEnd.y - rightSideStart.y) * b);
        numerator2 = ((rayTargetDirection.x - rayStart.x) * a) - ((rayTargetDirection.y - rayStart.y) * b);
        a = numerator1 / denominator;
        b = numerator2 / denominator;

        // If we cast these lines infinitely in both directions, they intersect here:
        result.x = rayStart.x + (a * (rayTargetDirection.x - rayStart.x));
        result.y = rayStart.y + (a * (rayTargetDirection.y - rayStart.y));

        // Assuming the ray is infinite, right side of prism intersects with it if:
        if (b > 0 && b < 1) {
            result.onPrism = true;
        }

        return result;
    }
}

(function () {
    /**
     * @type {SVGElement}
     */
    let selectedDragElement = null;
    let dragOffset = { cx: 0, cy: 0, y1: 0, y2: 0 };

    const svg = document.getElementById('prism-svg');
    const prism = new Prism(150, 0, 100);
    prism.draw();
    initEventHandling();
    const incidentRay = new IncidentRay(prism);
    incidentRay.draw();
    const refraction = new Refraction(incidentRay, prism);
    refraction.draw();


    function initEventHandling() {
        // Event handling of incident ray movement
        svg.addEventListener('mousedown', startDrag);
        svg.addEventListener('mousemove', drag);
        svg.addEventListener('mouseup', endDrag);

        svg.addEventListener('touchstart', startDrag);
        svg.addEventListener('touchmove', drag);
        svg.addEventListener('touchend', endDrag);
        svg.addEventListener('touchleave', endDrag);
        svg.addEventListener('touchcancel', endDrag);
    }

    function getMousePosition(evt) {
        var CTM = svg.getScreenCTM();

        // There may be multiple touches at once, take only one.
        if (evt.touches) {
            evt = evt.touches[0];
        }

        return {
            x: (evt.clientX - CTM.e) / CTM.a,
            y: (evt.clientY - CTM.f) / CTM.d
        };
    }

    function startDrag(evt) {
        if (!evt.target.classList.contains('draggable')) {
            return;
        }

        selectedDragElement = evt.target;
        let mousePos = getMousePosition(evt);

        if (selectedDragElement.id === 'incident-ray') {
            // Track offset for both y positions of the line.
            dragOffset.y1 = mousePos.y - parseFloat(selectedDragElement.getAttribute('y1'));
            dragOffset.y2 = mousePos.y - parseFloat(selectedDragElement.getAttribute('y2'));
        } else if (selectedDragElement.tagName === 'ellipse') {
            dragOffset.cx = mousePos.x - parseFloat(selectedDragElement.getAttribute('cx'));
            dragOffset.cy = mousePos.y - parseFloat(selectedDragElement.getAttribute('cy'));
        } else {
            throw new Error('SVG Element not supported in drag.');
        }
    }

    function drag(evt) {
        if (!selectedDragElement) {
            return;
        }

        evt.preventDefault();
        let mousePos = getMousePosition(evt);
        let moved = false;

        if (selectedDragElement.id === 'incident-ray') {
            let newY1 = mousePos.y - dragOffset.y1, newY2 = mousePos.y - dragOffset.y2;
            moved = incidentRay.tryMoveRay(newY1, newY2);
        } else if (selectedDragElement.tagName === 'ellipse') {
            let newCx = mousePos.x - dragOffset.cx, newCy = mousePos.y - dragOffset.cy;
            if (selectedDragElement.id === 'incident-start') {
                moved = incidentRay.tryMoveStart(newCx, newCy);
            } else if (selectedDragElement.id === 'incident-end') {
                moved = incidentRay.tryMoveEnd(newCy);
            } else {
                throw new Error('SVG Element not supported in drag.');
            }
        } else {
            throw new Error('SVG Element not supported in drag.');
        }

        if (moved) {
            refraction.draw();
        }
    }

    function endDrag(evt) {
        selectedDragElement = null;
    }
})();