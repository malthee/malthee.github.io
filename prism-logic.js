/**
 * Little prism project. Not intended to be 100% physically accurate ofc.
 * Thanks to https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/ for svg dragging mechanics.
 */


/**
 * The prism is a equilateral triangle with 60° angles. Its 
 */
class Prism {
    // Prism is a , angles are 60°
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
     * Gets the x position on the left side of the prism on the height of ypos.
     * @param {number} yPos 
     * @returns {bool} x position on the left side of the prism or -1 if doesn't exist.
     */
    getXPosOfLeftSide(yPos) {
        return yPos > this.bottomY || yPos < this.topY ?
            -1 : this.topX - ((yPos - this.topY) / Prism.angleTan);
    }

    /**
     * Initially draws the prism by setting its polygon points.
     */
    draw() {
        let prismHalfSide = this.height / Prism.angleTan;

        this.#prismElement.setAttribute('points', `
            ${this.topX - prismHalfSide},${this.height} 
            ${this.topX},${this.topY} 
            ${this.topX + prismHalfSide},${this.height}`);
    }
}

/**
 * An IncidentRay is white light going into a prism.
 */
class IncidentRay {
    #rayElement = document.getElementById('incident-ray');
    #startElement = document.getElementById('incident-start');
    #endElement = document.getElementById('incident-end');
    #prism

    /**
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

    /**
     * Gets the closest x position on the left side of the prism parallel to yPos.
     * @param {number} yPos 
     * @returns {number} x position on the left side of the prism or -1 if doesn't exist.
     */
    #getXPosOnLeftSide(yPos) {
        return yPos > prism.bottomY || yPos < prism.topY ?
            -1 : prism.topX - ((yPos - prism.topY) / Prism.angleTan);
    }

    /**
     * Tries to move the starting point of the incident ray.
     * @param {number} x 
     * @param {number} y 
     * @returns {bool} if position change was performed
     */
    tryMoveStart(x, y) {
        // Start has to be in view, above prism bottom, to the left side of the prism and end.
        if (y > prism.bottomY ||
            y < prism.topY && x >= prism.topX ||
            y < parseFloat(this.#endElement.getAttribute('cy')) && x >= parseFloat(this.#endElement.getAttribute('cx')) ||
            y >= prism.topY && x >= this.#getXPosOnLeftSide(y))
            return false;

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
        let newY = y <= prism.topY + 1 ? prism.topY + 1 :
            y >= prism.bottomY - 1 ? prism.bottomY - 1 : y;
        let x = this.#getXPosOnLeftSide(newY);

        if (this.#getXPosOnLeftSide(y) === -1) {
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
        // this.#rayElement.viewportElement.getBBox().x +
        let startPos = this.#startElement.getAttribute('rx');
        let yPos = this.#prism.topY + this.#prism.height / 2;
        let endPos = this.#getXPosOnLeftSide(yPos);

        this.#startElement.setAttribute('cx', startPos);
        this.#startElement.setAttribute('cy', yPos);
        this.#rayElement.setAttribute('x1', startPos);
        this.#rayElement.setAttribute('y1', yPos);
        this.#rayElement.setAttribute('x2', endPos);
        this.#rayElement.setAttribute('y2', yPos);
        this.#endElement.setAttribute('cx', endPos);
        this.#endElement.setAttribute('cy', yPos);
    }
}

class Refraction {
    /** @type {IncidentRay} */
    #incidentRay

    constructor(incidentRay, prism) {
        this.#incidentRay = incidentRay;
    }

    static get prismAConstant() {
        return 1.5;
    }

    static get prismBConstant() {
        return 0.05;
    }

    // Calculating n for snell's law: n = A + b/wv^2
    /**
     * n value of red light entering the prism. 
     */
    static get nRedPrism() {
        return Refraction.prismAConstant + Refraction.prismBConstant / Math.pow(0.665, 2);
    }

    static get nVioletPrism() {
        return Refraction.prismAConstant + Refraction.prismBConstant / Math.pow(0.4, 2);
    }

    draw() {
        this.#findPrismExitAngle(Refraction.nRedPrism);
    }

    #findPrismExitAngle(n) {
        let ang = this.#incidentRay.incidentAngle;
        console.log(ang * 180 / Math.PI);
        let redAngle = ang / Refraction.nRedPrism;
        let violetAngle = ang / Refraction.nVioletPrism;
        //Math.PI / 6

        let end = incidentRay.endPos;
        //let incidentRay.topX - end.x
        document.getElementById('test1').setAttribute('cy', 1)
        document.getElementById('test1').setAttribute('cx', 1)
        console.log([redAngle * 180 / Math.PI, violetAngle * 180 / Math.PI]);
    }

    #findPrismExitPoint(colorWaveLength) {
        // line 1 is prism right side
        // Justin c rounds algo
        // If the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) 

        var denominator, a, b, numerator1, numerator2, result = {
            x: null,
            y: null,
            onLine1: false,
            onLine2: false
        };
        denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
        if (denominator == 0) {
            return result;
        }
        a = line1StartY - line2StartY;
        b = line1StartX - line2StartX;
        numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
        numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
        a = numerator1 / denominator;
        b = numerator2 / denominator;

        // if we cast these lines infinitely in both directions, they intersect here:
        result.x = line1StartX + (a * (line1EndX - line1StartX));
        result.y = line1StartY + (a * (line1EndY - line1StartY));
        /*
                // it is worth noting that this should be the same as:
                x = line2StartX + (b * (line2EndX - line2StartX));
                y = line2StartX + (b * (line2EndY - line2StartY));
                */
        // if line1 is a segment and line2 is infinite, they intersect if:
        if (a > 0 && a < 1) {
            result.onLine1 = true;
        }
        // if line2 is a segment and line1 is infinite, they intersect if:
        if (b > 0 && b < 1) {
            result.onLine2 = true;
        }
        // if line1 and line2 are segments, they intersect if both of the above are true
        return result;
    };
}

/**
 * @type {SVGElement}
 */
let selectedDragElement = null;
let dragOffset = { cx: 0, cy: 0, y1: 0, y2: 0 };

const svg = document.getElementById('prism-svg');
const prism = new Prism(150, 0, 100);
prism.draw();
const incidentRay = new IncidentRay(prism);
incidentRay.draw();
const refraction = new Refraction(incidentRay, prism);

initEventHandling();

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

    // Event handling of window resizing

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