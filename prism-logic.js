/**
 * Little prism project. Not intended to be 100% physically accurate ofc. physics are hard.
 * Thanks to https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/ for svg dragging mechanics
 * and to Justin C. Rounds for the line intersection algorithm.
 * Lastly thanks to Willebrord Snellius for Snell's law and Augustin-Louis Cauchy for Cauchy's equation.
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
    #startPos
    #endPos
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
        // Start ray bottom to center of prism.
        const endPosY = this.#prism.topY + this.#prism.height / 2;
        this.#startPos = { x: parseFloat(this.#startElement.getAttribute('rx')), y: this.#prism.topY + this.#prism.height };
        this.#endPos = { x: this.#prism.getXPosOnLeftSide(endPosY), y: endPosY };
    }

    /**
     * Gets the incident angle of the incident ray in rad.
     */
    get incidentAngle() {
        let y1 = this.#startPos.y,
            y2 = this.#endPos.y,
            x1 = this.#startPos.x,
            x2 = this.#endPos.y;

        // Angle of line is calculated through its slope defined by the two points. 
        const baseAngle = Math.atan((y2 - y1) / (x2 - x1));
        // To get the incident angle along the prism normal 30 degrees is added and flipped if startX > endX.
        return baseAngle * (x2 > x1 ? -1 : 1) + Math.PI / 6;
    }

    get startPos() {
        return this.#startPos;
    }

    get endPos() {
        return this.#endPos;
    }

    get beamWidth() {
        return parseFloat(this.#rayElement.getAttribute('stroke-width'));
    }

    set beamWidth(value) {
        this.#rayElement.setAttribute('stroke-width', value);
        const r = value / 2 + 0.5;
        this.#startElement.setAttribute('cx', r);
        this.#startElement.setAttribute('cy', r);
        this.#endElement.setAttribute('cx', r);
        this.#endElement.setAttribute('cy', r);
    }

    #isEndPositionValid(x, y) {
        // End has to be right of start.
        return x > this.#startPos.x + this.beamWidth &&
            // And only between the prism coordinates.
            y > this.#prism.topY + this.beamWidth / 2 && y < this.#prism.bottomY - this.beamWidth / 2;
    }

    #isStartPositionValid(x, y) {
        // Start has to be left of infinite prism left side.
        return x < this.#prism.bottomLeftPos.x - ((this.#prism.topX - this.#prism.bottomLeftPos.x) / (this.#prism.bottomY - this.#prism.topY)) * (y - this.#prism.bottomY);
    }

    /**
     * Tries to move the starting point of the incident ray.
     * @param {number} x 
     * @param {number} y 
     * @returns {bool} if position change was performed
     */
    tryMoveStart(x, y) {
        if (!this.#isStartPositionValid(x, y)) {
            return false;
        }

        this.#startPos.x = x;
        this.#startPos.y = y;
        return true;
    }

    /**
     * Tries to move the end of the incident ray.
     * @param {number} y 
     * @returns {bool} if position change was performed
     */
    tryMoveEnd(y) {
        // End moves alongside left of prism.
        const x = this.#prism.getXPosOnLeftSide(y);

        if (!this.#isEndPositionValid(x, y)) {
            return false;
        }

        this.#endPos.y = y;
        this.#endPos.x = x;
        return true;
    }

    /**
     * Tries to move the whole incident ray on the y position.
     * @param {number} y1
     * @param {number} y2
     * @returns {bool} if position change was performed
     */
    tryMoveRay(y1, y2) {
        const endX = this.#prism.getXPosOnLeftSide(y2);

        if (!this.#isStartPositionValid(this.startPos.x, y1) || !this.#isEndPositionValid(endX, y2)) {
            return false;
        }

        this.#startPos.y = y1;
        this.#endPos.y = y2;
        this.#endPos.x = endX;
        return true;
    }

    /**
     * Draws the incident ray from the current start to end position.
     */
    draw() {
        this.#startElement.setAttribute('cx', this.#startPos.x);
        this.#startElement.setAttribute('cy', this.#startPos.y);
        this.#rayElement.setAttribute('x1', this.#startPos.x);
        this.#rayElement.setAttribute('y1', this.#startPos.y);
        this.#rayElement.setAttribute('x2', this.#endPos.x);
        this.#rayElement.setAttribute('y2', this.#endPos.y);
        this.#endElement.setAttribute('cx', this.#endPos.x);
        this.#endElement.setAttribute('cy', this.#endPos.y);
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

    // Constants taken from https://en.wikipedia.org/wiki/Cauchy%27s_equation
    /**
     * Material constant A of flint glass.
     */
    static prismAConstant = 1.67;
    /**
    * Material constant b of flint glass.
    */
    static prismBConstant = 0.00743;

    /**
     * 
     * @param {IncidentRay} incidentRay 
     * @param {Prism} prism 
     */
    constructor(incidentRay, prism) {
        this.#incidentRay = incidentRay;
        this.#prism = prism;
    }

    /**
     * n value of red light entering the prism. 
     */
    static get nRedPrism() {
        return Refraction.prismAConstant + (Refraction.prismBConstant / Math.pow(0.68, 2));
    }

    /**
     * Calculates the refractive index using Cauchy's equation.
     * @param {number} waveLength 
     * @returns 
     */
    static cauchysEquationN(waveLength) {
        return Refraction.prismAConstant + (Refraction.prismBConstant / Math.pow(waveLength, 2));
    }

    /**
    * n value of violet light entering the prism. 
    */
    static get nVioletPrism() {
        return Refraction.prismAConstant + (Refraction.prismBConstant / Math.pow(0.41, 2));
    }

    /**
     * Draws the Refraction using data from the IncidentRay and Prism.
     */
    draw() {
        const rayEnd = this.#incidentRay.endPos;
        const halfBeamWidth = this.#incidentRay.beamWidth / 2;
        // Since the beam is thick the top part will be used to calculate red, bottom part violet.
        const beamStartY = rayEnd.y - halfBeamWidth, beamEndY = rayEnd.y + halfBeamWidth;
        const refractionStart = { x: this.#prism.getXPosOnLeftSide(beamStartY), y: beamStartY },
            refractionEnd = { x: this.#prism.getXPosOnLeftSide(beamEndY), y: beamEndY };

        // Refraction inside of the prism.
        const redPrismEnd = this.#findPrismExitPoint(refractionStart, Refraction.nRedPrism),
            violetPrismEnd = this.#findPrismExitPoint(refractionEnd, Refraction.nVioletPrism);
        // TODO verify and fix drawing refraction on bottom of prism

        const refractStartDeviationX = (refractionEnd.x - refractionStart.x) / 7,
            refractStartDeviationY = (refractionEnd.y - refractionStart.y) / 7,
            refractEndDeviationX = (violetPrismEnd.x - redPrismEnd.x) / 7,
            refractEndDeviationY = (violetPrismEnd.y - redPrismEnd.y) / 7;

        // Refraction outside of the prism ends at width of the viewport.
        const endX = this.#refractionGroup.viewportElement.viewBox.baseVal.width;
        const redEnd = { x: endX, y: redPrismEnd.y + (endX - redPrismEnd.x) * Math.tan(this.#outAngleNormalized(Refraction.nRedPrism)) },
            violetEnd = { x: endX, y: violetPrismEnd.y + (endX - violetPrismEnd.x) * Math.tan(this.#outAngleNormalized(Refraction.nVioletPrism)) }
        const endDeviationY = (violetEnd.y - redEnd.y) / 7;

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
        const sinIncident = Math.sin(this.#incidentRay.incidentAngle);
        const angle = (Math.sqrt(3) / 2)
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
        // Ray may exit either bottom or right side of prism.  
        const bottomSideStart = this.#prism.bottomLeftPos,
            bottomSideEnd = this.#prism.bottomRightPos,
            rightSideStart = { x: this.#prism.topX, y: this.#prism.topY },
            rightSideEnd = this.#prism.bottomRightPos,
            rayTargetDirection = { x: rayStart.x + 1, y: rayStart.y + Math.tan(this.#refractionAngleNormalized(n)) };

        // Check for bottom intersection first as it is closer to the ray, otherwise use right side intersection.
        const bottomIntersection = Refraction.checkLineIntersection(rayStart, rayTargetDirection, bottomSideStart, bottomSideEnd);
        const chosenIntersection = bottomIntersection.isIntersect ? bottomIntersection : Refraction.checkLineIntersection(rayStart, rayTargetDirection, rightSideStart, rightSideEnd);

        return {
            x: chosenIntersection.x,
            y: chosenIntersection.y,
            isBottom: bottomIntersection == chosenIntersection
        }
    }

    /**
     * Checks if two lines defined by two points intersect.
     * Justin C. Rounds algorithm.
     * @param {{x, y}} line1StartPos 
     * @param {{x, y}} line1EndPos 
     * @param {{x, y}} line2StartPos 
     * @param {{x, y}} line2EndPos 
     * @returns {{x, y, isIntersect}} position and flag if infinitely cast line 1 intersects line 2
     */
    static checkLineIntersection(line1StartPos, line1EndPos, line2StartPos, line2EndPos) {
        // If the lines intersect, the result contains the x and y of the intersection treating them as infinite lines.
        var denominator, a, b, numerator1, numerator2, result = {
            x: null,
            y: null,
            isIntersect: false
        };

        denominator = ((line2EndPos.y - line2StartPos.y) * (line1EndPos.x - line1StartPos.x)) - ((line2EndPos.x - line2StartPos.x) * (line1EndPos.y - line1StartPos.y));
        if (denominator == 0) {
            return result;
        }
        a = line1StartPos.y - line2StartPos.y;
        b = line1StartPos.x - line2StartPos.x;
        numerator1 = ((line2EndPos.x - line2StartPos.x) * a) - ((line2EndPos.y - line2StartPos.y) * b);
        numerator2 = ((line1EndPos.x - line1StartPos.x) * a) - ((line1EndPos.y - line1StartPos.y) * b);
        a = numerator1 / denominator;
        b = numerator2 / denominator;

        // If we cast these lines infinitely in both directions, they intersect here:
        result.x = line1StartPos.x + (a * (line1EndPos.x - line1StartPos.x));
        result.y = line1StartPos.y + (a * (line1EndPos.y - line1StartPos.y));

        // Line 1 is infinite, it intersects line 2 if:
        if (b > 0 && b < 1) {
            result.isIntersect = true;
        }

        return result;
    };
}

(function () {
    /**
    * @type {SVGElement}
    */
    let selectedDragElement = null;
    let dragOffset = { cx: 0, cy: 0, y1: 0, y2: 0 };

    // Remove fallback content if JavaScript could not be executed.
    document.getElementById('browser-unsupported').classList.add('d-none');

    const svg = document.getElementById('prism-svg');
    const prism = new Prism(150, 0, 100);
    prism.draw();
    initEventHandling();
    const incidentRay = new IncidentRay(prism);
    incidentRay.draw();
    const refraction = new Refraction(incidentRay, prism);
    refraction.draw();
    svg.classList.remove('d-none'); // Svg is fully drawn, able to display

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
            incidentRay.draw();
            refraction.draw();
        }
    }

    function endDrag() {
        selectedDragElement = null;
    }
})();