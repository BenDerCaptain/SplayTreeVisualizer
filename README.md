# SplayNet-AlgorithmVisualizer

Use this splaynet visualizer to learn about the splaynet algorithm via animations.

# Careful
Animation type option: StepByStep not tested!

# Navbar
The navbar has several elements to offer
1. An input field, where you can decide how many nodes you want in the tree
2. A generate button to generate the tree
3. A reset button to reset the tree to it's original (balanced) state
4. A save button to store the number of nodes and the communications done in a file
5. A load button to load the stored file
6. An animationtype selector, where you can select different animation types:
6.1. Flow -> needs a start click, continues to animate until finished
6.2. AutoFlow -> starts after source/destination selection, continues to animate until finished
6.3. StepByStep -> needs a start click, needs a click to continue after each rotation (zig, zigzig, zigzag) !WARNING!: Unfinished
7. An Animationspeed slider to change the animation speed
8. A StartAnimation button to start the animation (for flow and stepbystep animation type)
9. A source and destination display to check the selected source/destination pair 

# HOW TO

1. Input a number of nodes on the topleft and click "generate" to generate a tree (if you don't like the basic 15-node tree)
2. To animate the tree we need to select source and destination node which should communicate with each other. To facilitate that:
2.1. Click and hold the left mouse button on the source node
2.2. Drag the mouse over to the destination node
2.3. Release the mouse over the destinatnion node
2.4. Check in the top right navbar, if the correct source and destination were selected
2.5. Start the animation (depends on animation type)
3. press middle mouse button to pan the svg plane
4. use the mouse wheel to zoom the svg plane