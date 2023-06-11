# malthee.github.io Prism
Inspired by the Pink Floyd album *The Dark Side of the Moon*. 
This is a little JavaScript project simulating the dispersion and refraction of light going into a prism. 
This is not meant to be physically accurate, but I am happy to add improvements to make it more realistic! 

![Prism](https://github.com/malthee/malthee.github.io/assets/18032233/00a163fb-e670-4e15-b2ef-bec53f45b092)

## Features
* The light ray can be moved via the start, end and center. Its location is limited to the left side of the prism.
* The prism can be clicked to toggle a settings menu where variables used in the refraction formula can be adjusted.

## How it works
1. The angle of the ray is calculated and adjusted to the normal of the prism.
2. The calculated incident angle is used in Snell's law with the material constants to get two angles: the internal red and violet refraction.
  2.a. The refractive index is calculated with Cauchy's equation.
3. For both angles the closest intersection with the prism bottom or right side is calculated.
4. From here on the output angle is calculated depending on the exit position - either right or bottom.
5. A polygon for each color is drawn by interpolation of positions between the red and violet output.

Have fun playing around.
