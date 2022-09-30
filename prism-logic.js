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
    #prismElement;

    /**
     * Gets the angle of the prism in rad (60deg).
     */
    #angle = Math.PI / 3;
    #angleTan = Math.tan(this.#angle);

    /**
     * 
     * @param {number} topX 
     * @param {number} topY 
     * @param {number} height 
     * @param {SVGElement} prismElement  
     */
    constructor(topX, topY, height, prismElement) {
        this.topX = topX;
        this.topY = topY;
        this.height = height;
        this.#prismElement = prismElement;
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
        return { x: this.topX + this.height / this.#angleTan, y: this.topY + this.height }
    }

    /**
    * Gets the bottom left position of the prism.
    */
    get bottomLeftPos() {
        return { x: this.topX - this.height / this.#angleTan, y: this.topY + this.height }
    }

    /**
     * Gets the closest x position on the left side of the prism parallel to yPos.
     * @param {number} yPos 
     * @returns {number} x position on the left side of the prism or -1 if doesn't exist.
     */
    getXPosOnLeftSide(yPos) {
        return yPos > this.bottomY || yPos < this.topY ?
            -1 : this.topX - ((yPos - this.topY) / this.#angleTan);
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
    #prism

    #startElement
    #rayElement
    #endElement

    /** Expands the hitbox where elements can be found.  */
    #hitRange = 12;
    #doubleHitRange = this.#hitRange * 2;

    /**
     * 
     * @param {Prism} prism 
     * @param {SVGElement} startElement 
     * @param {SVGElement} rayElement 
     * @param {SVGElement} endElement 
     */
    constructor(prism, startElement, rayElement, endElement) {
        this.#prism = prism;
        this.#startElement = startElement;
        this.#rayElement = rayElement;
        this.#endElement = endElement;
        // Start ray bottom to center of prism.
        const endPosY = this.#prism.topY + this.#prism.height / 2;
        this.#startPos = { x: parseFloat(this.#startElement.getAttribute('rx')), y: this.#prism.topY + this.#prism.height };
        this.#endPos = { x: this.#prism.getXPosOnLeftSide(endPosY), y: endPosY };
    }

    get rayAngle() {
        const y1 = this.#startPos.y,
            y2 = this.#endPos.y,
            x1 = this.#startPos.x,
            x2 = this.#endPos.x;

        // Angle of line is calculated through its slope defined by the two points. 
        const baseAngle = Math.atan((y2 - y1) / (x2 - x1));
        // Add difference to 90° when line start goes over end in x coordinates.
        return (x2 > x1 ? baseAngle : Math.PI / 2 + (Math.PI / 2 + baseAngle));
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
        this.#startElement.setAttribute('rx', r);
        this.#startElement.setAttribute('ry', r);
        this.#endElement.setAttribute('rx', r);
        this.#endElement.setAttribute('ry', r);
    }

    #isEndPositionValid(x, y) {
        // End has to be on prism side.
        return y > this.#prism.topY + this.beamWidth / 2 && y < this.#prism.bottomY - this.beamWidth / 2;
    }

    #isStartPositionValid(x, y) {
        // Start has to be left of infinite prism left side.
        return x < this.#prism.bottomLeftPos.x - ((this.#prism.topX - this.#prism.bottomLeftPos.x) / (this.#prism.bottomY - this.#prism.topY)) * (y - this.#prism.bottomY);
    }

    /**
     * Checks if the point x, y is located in the bounds of the box.
     * @param {number} x 
     * @param {number} y 
     * @param {SVGRect} box 
     * @returns {bool}
     */
    #isInBBox(x, y, box) {
        return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
    }

    /**
     * Finds the closest ray element to the provided position. If nothing is in range returns null.
     * @param {number} x 
     * @param {number} y
     * @returns {SVGElement} closest element or null.
     */
    findClosestRayElement(x, y) {
        const rayBox = this.#rayElement.getBBox();
        const startBox = this.#startElement.getBBox();
        const endBox = this.#endElement.getBBox();

        rayBox.height += this.#doubleHitRange;
        rayBox.y -= this.#hitRange;
        // Start and end get padding all around.
        startBox.y -= this.#hitRange;
        startBox.x -= this.#hitRange;
        startBox.width = this.#doubleHitRange;
        startBox.height = this.#doubleHitRange;
        endBox.y -= this.#hitRange;
        endBox.x -= this.#hitRange;
        endBox.width = this.#doubleHitRange;
        endBox.height = this.#doubleHitRange;

        let res = null;
        // Check start and end first.
        if (this.#isInBBox(x, y, startBox)) {
            res = this.#startElement;
        } else if (this.#isInBBox(x, y, endBox)) {
            res = this.#endElement;
        } else if (this.#isInBBox(x, y, rayBox)) {
            res = this.#rayElement;
        }

        return res;
    }

    /**
     * Gets the incident angle depending on the direction the ray is facing.
     * @param {['right, bottom']} direction which the ray is traveling to from the left side.
     * @returns 
     */
    getIncidentAngle(direction) {
        // To move the angle on the normal of the prism.
        switch (direction) {
            case 'bottom':
                return this.rayAngle * -1 - Math.PI / 6;
            case 'right':
                return this.rayAngle * -1 + Math.PI / 6;
            default:
                throw new Error('Direction not supported by getIncidentAngle');
        }
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
    #refractions
    #refractionGroup

    #incidentRay
    #prism

    // Constants taken from https://en.wikipedia.org/wiki/Cauchy%27s_equation
    // Material constant A of flint glass.
    #prismAConstant = 1.67;
    // Material constant b of flint glass.
    #prismBConstant = 0.00743;
    // Refractive indices of light entering the prism
    #nRed
    #nViolet

    /**
     * 
     * @param {IncidentRay} incidentRay 
     * @param {Prism} prism 
     * @param {SVGElement} refractionGroup Group element containing polygons for visible colors. 
     */
    constructor(incidentRay, prism, refractionGroup) {
        this.#incidentRay = incidentRay;
        this.#prism = prism;
        this.#refractionGroup = refractionGroup;
        this.#refractions = this.#refractionGroup.children;
        this.#setRefractiveIndices();
    }

    get prismAConstant() {
        return this.#prismAConstant;
    }

    set prismAConstant(value) {
        this.#prismAConstant = value;
        this.#setRefractiveIndices();
    }

    get prismBConstant() {
        return this.#prismBConstant;
    }

    set prismBConstant(value) {
        this.#prismBConstant = value;
        this.#setRefractiveIndices();
    }

    #setRefractiveIndices() {
        this.#nRed = this.#cauchysEquationN(0.68);
        this.#nViolet = this.#cauchysEquationN(0.41);
    }

    /**
     * Calculates the refractive index using Cauchy's equation.
     * @param {number} waveLength 
     * @returns 
     */
    #cauchysEquationN(waveLength) {
        return this.prismAConstant + (this.prismBConstant / Math.pow(waveLength, 2));
    }

    /**
     * Gets the out angle for a specific refraction index normalized for display angle.
     * @param {number} n refraction index
     * @param {['bottom', 'right']} direction for the direction
     */
    #outAngleNormalized(n, direction) {
        const incidentAngle = this.#incidentRay.getIncidentAngle(direction);
        const sinIncident = Math.sin(incidentAngle);
        const angle = (Math.sqrt(3) / 2)
            * Math.sqrt(Math.pow(n, 2) - Math.pow(sinIncident, 2))
            - sinIncident / 2;
        // Adjusting angle for display, TODO check this for correctness
        const res = direction == 'right' ? angle - Math.PI / 6 : (angle - Math.PI / 2) * Math.PI;
        return res;
    }

    /**
     * Gets the angle of refraction for a specific refraction index normalized for display angle.
     * @param {number} n refraction index
     */
    #refractionAngleNormalized(n) {
        // For internal refraction it is sufficient to only use the incident angle for rays going right.
        return Math.asin(Math.sin(this.#incidentRay.getIncidentAngle('right')) / n)
            * -1 + Math.PI / 6;
    }

    /**
     * Finds the point of intersection of the refracted ray with the right side of a prism if exists.
     * @param {{x, y}} rayStart start of refraction
     * @param {number} n refraction index 
     * @returns {{x, y, direction}} position of intersection and its direction
     */
    #findPrismExitPoint(rayStart, n) {
        // Ray may exit either bottom or right side of prism.  
        const bottomSideStart = this.#prism.bottomLeftPos,
            bottomSideEnd = this.#prism.bottomRightPos,
            rightSideStart = { x: this.#prism.topX, y: this.#prism.topY },
            rightSideEnd = this.#prism.bottomRightPos,
            rayTargetDirection = { x: rayStart.x + 1, y: rayStart.y + Math.tan(this.#refractionAngleNormalized(n)) };

        // Check for bottom intersection first as it is closer to the ray, otherwise use right side intersection.
        const bottomIntersection = this.#findLineIntersection(rayStart, rayTargetDirection, bottomSideStart, bottomSideEnd);
        const chosenIntersection = bottomIntersection.isIntersect ?
            bottomIntersection :
            this.#findLineIntersection(rayStart, rayTargetDirection, rightSideStart, rightSideEnd);

        return {
            x: chosenIntersection.x,
            y: chosenIntersection.y,
            direction: chosenIntersection === bottomIntersection ? 'bottom' : 'right'
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
    #findLineIntersection(line1StartPos, line1EndPos, line2StartPos, line2EndPos) {
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
    }

    /**
    * Draws the Refraction using data from the IncidentRay and Prism.
    */
    draw() {
        const rayEnd = this.#incidentRay.endPos;
        const halfBeamWidth = this.#incidentRay.beamWidth / 2;
        const colorCount = this.#refractions.length;
        // The beam top part will be used to calculate red, bottom part violet.
        const beamStartY = rayEnd.y - halfBeamWidth, beamEndY = rayEnd.y + halfBeamWidth;
        const refractionStart = { x: this.#prism.getXPosOnLeftSide(beamStartY), y: beamStartY },
            refractionEnd = { x: this.#prism.getXPosOnLeftSide(beamEndY), y: beamEndY };

        // Refraction inside of the prism.
        const redPrismEnd = this.#findPrismExitPoint(refractionStart, this.#nRed),
            violetPrismEnd = this.#findPrismExitPoint(refractionEnd, this.#nViolet);

        const refractStartDeviationX = (refractionEnd.x - refractionStart.x) / colorCount,
            refractStartDeviationY = (refractionEnd.y - refractionStart.y) / colorCount,
            refractEndDeviationX = (violetPrismEnd.x - redPrismEnd.x) / colorCount,
            refractEndDeviationY = (violetPrismEnd.y - redPrismEnd.y) / colorCount;

        // Refraction outside of the prism ends at width of the viewport.
        const endX = this.#refractionGroup.viewportElement.viewBox.baseVal.width;
        const redEnd = { x: endX, y: redPrismEnd.y + (endX - redPrismEnd.x) * Math.tan(this.#outAngleNormalized(this.#nRed, redPrismEnd.direction)) },
            violetEnd = { x: endX, y: violetPrismEnd.y + (endX - violetPrismEnd.x) * Math.tan(this.#outAngleNormalized(this.#nViolet, violetPrismEnd.direction)) }
        const endDeviationY = (violetEnd.y - redEnd.y) / colorCount;

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
}

(function () {
    // Remove fallback content if JavaScript could not be executed.
    document.getElementById('browser-unsupported').classList.add('d-none');

    /**
    * @type {SVGElement}
    */
    let selectedDragElement = null;
    let dragOffset = { x1: 0, x2: 0, y1: 0, y2: 0 };
    const svg = document.getElementById('prism-svg');
    const settingsContainer = document.getElementById('settings-container');
    const prismGlass = document.getElementById('prism-glass');

    const prism = new Prism(150, 0, 100, prismGlass);
    prism.draw();
    const incidentRay = new IncidentRay(prism, document.getElementById('incident-start'), document.getElementById('incident-ray'), document.getElementById('incident-end'));
    incidentRay.draw();
    const refraction = new Refraction(incidentRay, prism, document.getElementById('prism-refraction'));
    refraction.draw();
    initEventHandling();
    svg.classList.remove('d-none'); // Svg is fully drawn, able to display.
    initSettings();

    /**
     * Initializes the event handling for SVG elements.
     */
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

    /**
     * Initializes the textDisplay and sets up a one-way-bind between the input value and textDisplay.
     * @param {HTMLInputElement} input 
     * @param {HTMLElement} textDisplay 
     * @param {number} initialValue 
     * @param {Function} valueSetter 
     */
    function bindSetting(input, textDisplay, initialValue, valueSetter) {
        textDisplay.innerText = initialValue;
        input.value = initialValue;

        input.addEventListener('input', () => {
            textDisplay.innerText = input.value;
            valueSetter();
            refraction.draw();
        });
    }

    /**
     * Initializes the binding of settings and event handling.
     */
    function initSettings() {
        const rangeA = document.getElementById('range-a'),
            valueA = document.getElementById('value-a'),
            rangeB = document.getElementById('range-b'),
            valueB = document.getElementById('value-b'),
            rangeRay = document.getElementById('range-ray'),
            valueRay = document.getElementById('value-ray');

        const bValueMult = 1000; // Adjusted B for easier display.
        bindSetting(rangeRay, valueRay, incidentRay.beamWidth, () => incidentRay.beamWidth = parseFloat(rangeRay.value));
        bindSetting(rangeA, valueA, refraction.prismAConstant, () => refraction.prismAConstant = parseFloat(rangeA.value));
        bindSetting(rangeB, valueB, refraction.prismBConstant * bValueMult, () => refraction.prismBConstant = parseFloat(rangeB.value) / bValueMult);

        prismGlass.addEventListener('click', toggleSettings);
        document.getElementById('button-close-settings').addEventListener('click', closeSettings);
    }

    function toggleSettings() {
        settingsContainer.classList.toggle('move-in');
    }

    function closeSettings() {
        settingsContainer.classList.remove('move-in');
    }

    /**
     * Gets the current mouse or first touch position.
     * @param {MouseEvent} evt 
     * @returns coordinates
     */
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

    /**
     * Tries to start dragging a SVG element near to the mouse position. 
     * @param {MouseEvent} evt 
     * @returns 
     */
    function startDrag(evt) {
        const mousePos = getMousePosition(evt);
        if (!evt.target.classList.contains('draggable')) {
            // Check if any draggable element is close, select it. Useful for mobile and small elements.
            selectedDragElement = incidentRay.findClosestRayElement(mousePos.x, mousePos.y);

            if (selectedDragElement === null) {
                return;
            }
        } else {
            selectedDragElement = evt.target;
        }

        // Track offset for start and end positions of line.
        dragOffset.y1 = mousePos.y - incidentRay.startPos.y;
        dragOffset.y2 = mousePos.y - incidentRay.endPos.y;
        dragOffset.x1 = mousePos.x - incidentRay.startPos.x;
        dragOffset.x2 = mousePos.x - incidentRay.endPos.x;
    }

    /**
     * Drags the currently selected SVG element and redraws the light going through the prism.
     * @param {MouseEvent} evt 
     * @returns 
     */
    function drag(evt) {
        if (!selectedDragElement) {
            return;
        }

        evt.preventDefault();
        const mousePos = getMousePosition(evt);
        let moved = false;

        if (selectedDragElement.id === 'incident-ray') {
            const newY1 = mousePos.y - dragOffset.y1, newY2 = mousePos.y - dragOffset.y2;
            moved = incidentRay.tryMoveRay(newY1, newY2);
        } else if (selectedDragElement.id === 'incident-start') {
            const newCx = mousePos.x - dragOffset.x1, newCy = mousePos.y - dragOffset.y1;
            moved = incidentRay.tryMoveStart(newCx, newCy);
        } else if (selectedDragElement.id === 'incident-end') {
            const newCy = mousePos.y - dragOffset.y2;
            moved = incidentRay.tryMoveEnd(newCy);
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