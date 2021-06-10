let draw;
let width;
let height;
let CIRCLE_DIAMETER = 20;
let CIRCLE_RADIUS = CIRCLE_DIAMETER/2;
let MARGIN_TOP = 20;


let SelectedSource = -1;
let SelectedDestination = -1;

//do viewbox zooming!
//do viewbox panning!

function initSVG(heightVal, widthVal){
    width = widthVal;
    height = heightVal;
    let svg = SVG().addTo('#SVGContainer');
    draw = svg.viewbox(0, 0, width, height)
}

function createSVGTree(splayTree){
    draw.clear()

    let lineGroup = draw.group().id("lineGroup")
    let nodeGroup = draw.group().id("nodeGroup")
    let textGroup = draw.group().id("textGroup")
    buildNodes(nodeGroup, textGroup, lineGroup, width/2, width/2, 0, splayTree.root)
}

function buildNodes(nodeGroup, textGroup, lineGroup, xposition, halfwidth, ylevel, node){
    let circle = nodeGroup
        .circle(CIRCLE_DIAMETER)
        .move(xposition-CIRCLE_RADIUS, ylevel*CIRCLE_DIAMETER*5+(MARGIN_TOP-CIRCLE_RADIUS))
        .id("node_"+node.value.toString())

    circle.attr("node-value", node.value.toString())
    circle.fill('#00278B')
    circle.on('mousedown', selectSource)
    circle.on('mouseup', selectDestination)

    let text = textGroup
        .text(node.value.toString())
        .move(xposition, ylevel*CIRCLE_DIAMETER*5+(MARGIN_TOP-CIRCLE_RADIUS))
        .id("node_"+node.value.toString()+"_text")
        .css("pointer-events", "none")

    text.font({anchor: 'middle', fill: '#fff', family: 'Calibri', size: 15 })

    if(node.leftChild !== null){
        let line = lineGroup
            .line(xposition, ylevel*CIRCLE_DIAMETER*5+MARGIN_TOP, xposition - (halfwidth/2.), (ylevel+1)*CIRCLE_DIAMETER*5+MARGIN_TOP)
            .id("connector_"+node.value.toString()+"_"+node.leftChild.value.toString())
        line.stroke({ color: 'lightgrey', width: 3})
        buildNodes(nodeGroup, textGroup, lineGroup, xposition - (halfwidth/2.), halfwidth/2., ylevel+1, node.leftChild);
    }

    if(node.rightChild !== null){
        let line = lineGroup
            .line(xposition, ylevel*CIRCLE_DIAMETER*5+MARGIN_TOP, xposition + (halfwidth/2.), (ylevel+1)*CIRCLE_DIAMETER*5+MARGIN_TOP)
            .id("connector_"+node.value.toString()+"_"+node.rightChild.value.toString())
        line.stroke({ color: 'lightgrey', width: 3})
        buildNodes(nodeGroup, textGroup, lineGroup, xposition + (halfwidth/2.), halfwidth/2., ylevel+1, node.rightChild);
    }
}

function getSelectedSource(){
    return SelectedSource
}

function getSelectedDestination(){
    return SelectedDestination
}

function selectSource(){
    SelectedSource = this.attr("node-value")
}

function selectDestination(){
    SelectedDestination = this.attr("node-value")
}

function reset(){
    SelectedSource = -1
    SelectedDestination = -1
}


let timeline = new SVG.Timeline();
var start_time = 0;

function stepAnimation(step, sourceNode) {
    console.log(step + "\ rotation")
    //setup timeline
    let is_left_child = (sourceNode.parent.leftChild === sourceNode)
    switch(step){
        case "ZIG":
            if(is_left_child) start_time = zig(sourceNode, timeline, start_time)
            else start_time = zag(sourceNode, timeline, start_time)
            break;
        case "ZIGZIG":
            if(is_left_child) {
                start_time = zigzig(sourceNode, timeline, start_time)
            }
            else {
                start_time = zagzag(sourceNode, timeline, start_time)
            }
            break;
        case "ZIGZAG":
            if(is_left_child){
                start_time = zigzag(sourceNode, timeline, start_time)
            }
            else {
                start_time = zagzig(sourceNode, timeline, start_time)
            }
            break;
    }

    let done_runner = new SVG.Runner()
    done_runner.timeline(timeline)
    done_runner.animate(1, start_time, "absolute").after(function (){console.log("done")})
}

function finish_animation(){
    timeline = new SVG.Timeline()
    start_time = 0
}

function zag(nodeToRotate, timeline, start_time) {
    console.log("zag rotation");
    //      x, p... Nodes
    //      A, B, C... Subtrees
    //
    //       p            x
    //      / \          / \
    //     A   x    =   p   C
    //        / \      / \
    //       B   C    A   B
    //

    //Preorchestrate animation on the current positions
    //execute animations as two zig rotations
    //
    //1. Zag x
    //1.1 move x to p (up)
    //1.2 move p to A (down)
    //1.3 move A to p.left (down)
    //1.4 move B to p.right (left)
    //1.5 move C to x.right (up)
    //3. Redraw lines (FIN)
    //
    let destinationNode = nodeToRotate.parent;
    let y_level = destinationNode.level()

    let idSource = "#node_" + nodeToRotate.value;
    let idSource_text = "#node_" + nodeToRotate.value + "_text";

    let idDest = "#node_" + destinationNode.value;
    let idDest_text = "#node_" + destinationNode.value + "_text";

    let nodeToAnimate = SVG(idSource)
    let textToAnimate = SVG(idSource_text)

    let targetNode = SVG(idDest)
    let targetText = SVG(idDest_text)

    //common ancestor positon -> important for all other positionings
    let target_xpos = targetNode.attr("cx");
    let target_ypos = targetNode.attr("cy");

    //Zig source to target
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move

    ////parent -> left rot -> left child
    let left_child_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
    let left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    ////parent leftchild + subtree -> move down
    let downNode = destinationNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level+2, left_child_xpos, "left")

    ////src leftchild + subtree -> move left
    let leftNode = nodeToRotate.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, leftNode, y_level+2, left_child_xpos, "right")

    ////src rightchild + subtree -> move up
    let upNode = nodeToRotate.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level+1, target_xpos, "right")

    return start_time
}

function zig(nodeToRotate, timeline, start_time) {
    console.log("zig rotation");
    //      x, p... Nodes
    //      A, B, C... Subtrees
    //
    //         p            x
    //        / \          / \
    //       x   C  =     A   p
    //      / \              / \
    //     A   B            B   C
    //

    //Preorchestrate animation on the current positions
    //execute animations as two zig rotations
    //
    //1. Zig x
    //1.1 move x to p (up)
    //1.2 move p to C (down)
    //1.3 move C to p.right (down)
    //1.4 move B to p.left (right)
    //1.5 move A to x.left (up)
    //3. Redraw lines (FIN)
    //

    let destinationNode = nodeToRotate.parent;
    console.log(destinationNode)
    let y_level = destinationNode.level()

    let idSource = "#node_" + nodeToRotate.value;
    let idSource_text = "#node_" + nodeToRotate.value + "_text";

    let idDest = "#node_" + destinationNode.value;
    let idDest_text = "#node_" + destinationNode.value + "_text";

    let nodeToAnimate = SVG(idSource)
    let textToAnimate = SVG(idSource_text)

    let targetNode = SVG(idDest)
    let targetText = SVG(idDest_text)

    //common ancestor positon -> important for all other positionings
    let target_xpos = targetNode.attr("cx");
    let target_ypos = targetNode.attr("cy");

    //Zig source to target
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move

    ////parent -> right rot -> right child
    let left_child_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
    let left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    ////parent rightChild + subtree -> move down
    let downNode = destinationNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "right")

    ////src rightchild + subtree -> move right
    let leftNode = nodeToRotate.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, leftNode, y_level + 2, left_child_xpos, "left")

    ////src leftchild + subtree -> move up
    let upNode = nodeToRotate.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "left")

    return start_time;

}

function zagzag(nodeToRotate, timeline, start_time) {
    console.log("zagzag rotation");

    //      x, p, g... Nodes
    //      A, B, C, D... Subtrees
    //
    //      g                       x
    //     / \                     / \
    //    A   p                   p   D
    //       / \       =         / \
    //      B   x               g   C
    //         / \             / \
    //        C   D           A   B

    //Preorchestrate animation on the current positions
    //execute animations as two zig rotations
    //
    //1. Zag p
    //1.1 move p to g (up)
    //1.2 move g to A (down)
    //1.3 move A to g.left (down)
    //1.4 move B to g.right (left)
    //1.5 move x to p.right (up)
    //2. Zag x
    //2.1 move x to p (up)
    //2.2 move p to g (down)
    //2.3 move g to A (down)
    //2.4 move A to g.left (down)
    //2.5 move B to g.right (down)
    //2.6 move C to p.right (left)
    //2.7 move D to x.right (up)
    //3. Redraw lines (FIN)

    //CREATING DATA FIELDS

    let sourceNode = nodeToRotate
    let parentNode = nodeToRotate.parent;
    let grandParentNode = nodeToRotate.parent.parent;

    //granparent is the highest in the list, so the search is quickest
    let grandparent_y_level = grandParentNode.level()
    let parent_y_level = grandparent_y_level + 1
    let source_y_level = parent_y_level + 1

    let idSource = "#node_" + sourceNode.value;
    let idSource_text = "#node_" + sourceNode.value + "_text";

    let idParent = "#node_" + parentNode.value;
    let idParent_text = "#node_" + parentNode.value + "_text";

    let idGParent = "#node_" + grandParentNode.value;
    let idGParent_text = "#node_" + grandParentNode.value + "_text";

    /// ANIMATION VALUES DEFINITIONS
    let nodeToAnimate;
    let textToAnimate;
    let targetNode;
    let targetText;
    let target_xpos;
    let target_ypos;
    let left_child_xpos;
    let left_child_ypos;
    let downNode;
    let leftNode;
    let upNode;
    let bridgeNode;
    let bridgeText;

    /// ANIMATION START

    //Zig parent to destination
    //1. Zag p

    //get nodes to animate (parent, grandparent)
    nodeToAnimate = SVG(idParent)
    textToAnimate = SVG(idParent_text)

    targetNode = SVG(idGParent)
    targetText = SVG(idGParent_text)

    //target (grandparent) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //1.1 move p to g (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move
    let y_level = grandparent_y_level;

    //1.2 move g to A (down)
    left_child_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    //1.3 move A to g.left (down)
    downNode = grandParentNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "left")

    //1.4 move B to g.right (left)
    leftNode = parentNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, leftNode, y_level + 2, left_child_xpos, "righ")

    //1.5 move x to p.right (up)
    upNode = parentNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "right")

    //zig target to destination
    //2. Zag x

    //get nodes to animate (source, parent)
    nodeToAnimate = SVG(idSource)
    textToAnimate = SVG(idSource_text)

    bridgeNode = SVG(idParent)
    bridgeText = SVG(idParent_text)

    targetNode = SVG(idGParent)
    targetText = SVG(idGParent_text)

    //target (still grandparent, since animation didn't play yet) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //2.1 move x to p (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move

    //2.2 move p to g (down)
    left_child_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(bridgeNode, bridgeText, timeline, start_time, left_child_xpos, left_child_ypos);

    //2.3 move g to A (down)
    let left_lower_child_xpos = left_child_xpos - width / Math.pow(2, (y_level + 2) + 1);
    let left_lower_ypos = (y_level + 2) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    moveTo(targetNode, targetText, timeline, start_time, left_lower_child_xpos, left_lower_ypos);

    //2.4 move A to g.left (down)
    downNode = grandParentNode.leftChild;
    moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 3, left_lower_child_xpos, "left")

    //2.5 move B to g.right (down)
    downNode = parentNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, leftNode, y_level + 3, left_lower_child_xpos, "right")

    //2.6 move C to p.right (left)
    leftNode = sourceNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, leftNode, y_level + 2, left_child_xpos, "right")

    //2.7 move D to x.right (up)
    upNode = sourceNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "right")

    //3. Redraw lines (FIN)
    return start_time;

}

function zigzig(nodeToRotate, timeline, start_time) {

    console.log("zigzig rotation");

    //      x, p, g... Nodes
    //      A, B, C, D... Subtrees
    //
    //          g            x
    //         / \          / \
    //        p   D        A   p
    //       / \      =>      / \
    //      x   C            B   g
    //     / \                  / \
    //    A   B                C   D

    //Preorchestrate animation on the current positions
    //execute animations as two zig rotations
    //
    //1. Zig p
    //1.1 move p to g (up)
    //1.2 move g to D (down)
    //1.3 move D to g.right (down)
    //1.4 move C to g.left (right)
    //1.5 move x to p.left (up)
    //2 Zig x
    //2.1 move x to p (up)
    //2.2 move p to g (down)
    //2.3 move g to D (down)
    //2.4 move D to g.right (down)
    //2.5 move C to g.left (down)
    //2.6 move B to p.left (right)
    //2.7 move A to x.left (up)
    //3. Redraw lines (FIN)

    //CREATING DATA FIELDS

    let sourceNode = nodeToRotate
    let parentNode = nodeToRotate.parent;
    let grandParentNode = nodeToRotate.parent.parent;

    //granparent is the highest in the list, so the search is quickest
    let grandparent_y_level = grandParentNode.level()
    let parent_y_level = grandparent_y_level + 1
    let source_y_level = parent_y_level + 1

    let idSource = "#node_" + sourceNode.value;
    let idSource_text = "#node_" + sourceNode.value + "_text";

    let idParent = "#node_" + parentNode.value;
    let idParent_text = "#node_" + parentNode.value + "_text";

    let idGParent = "#node_" + grandParentNode.value;
    let idGParent_text = "#node_" + grandParentNode.value + "_text";

    /// ANIMATION VALUES DEFINITIONS
    let nodeToAnimate;
    let textToAnimate;
    let targetNode;
    let targetText;
    let target_xpos;
    let target_ypos;
    let left_child_xpos;
    let left_child_ypos;
    let downNode;
    let leftNode;
    let upNode;
    let bridgeNode;
    let bridgeText;

    /// ANIMATION START

    //Zig parent to destination
    //1. Zig p

    //get nodes to animate (parent, grandparent)
    nodeToAnimate = SVG(idParent)
    textToAnimate = SVG(idParent_text)

    targetNode = SVG(idGParent)
    targetText = SVG(idGParent_text)

    //target (grandparent) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //1.1 move p to g (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move
    let y_level = grandparent_y_level;

    //1.2 move g to D (down)
    left_child_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    //1.3 move D to g.right (down)
    downNode = grandParentNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "right")

    //1.4 move C to g.left (right)
    leftNode = parentNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, leftNode, y_level + 2, left_child_xpos, "left")

    //1.5 move x to p.left (up)
    upNode = parentNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "left")

    //zig target to destination
    // 2 Zig x

    //get nodes to animate (source, parent)
    nodeToAnimate = SVG(idSource)
    textToAnimate = SVG(idSource_text)

    bridgeNode = SVG(idParent)
    bridgeText = SVG(idParent_text)

    targetNode = SVG(idGParent)
    targetText = SVG(idGParent_text)

    //target (still grandparent, since animation didn't play yet) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //2.1 move x to p (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move

    //2.2 move p to g (down)
    left_child_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(bridgeNode, bridgeText, timeline, start_time, left_child_xpos, left_child_ypos);

    //2.3 move g to D (down)
    let left_lower_child_xpos = left_child_xpos + width / Math.pow(2, (y_level + 2) + 1);
    let left_lower_ypos = (y_level + 2) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    moveTo(targetNode, targetText, timeline, start_time, left_lower_child_xpos, left_lower_ypos);

    //2.4 move D to g.right (down)
    downNode = grandParentNode.rightChild;
    moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 3, left_lower_child_xpos, "right")

    //2.5 move C to g.left (down)
    downNode = parentNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, leftNode, y_level + 3, left_lower_child_xpos, "left")

    //2.6 move B to p.left (right)
    leftNode = sourceNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, leftNode, y_level + 2, left_child_xpos, "left")

    //2.7 move A to x.left (up)
    upNode = sourceNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "left")

    //3. Redraw lines (FIN)
    return start_time;

}

function zagzig(nodeToRotate, timeline, start_time) {
    console.log("zagzig rotation");

    //      x, p, g... Nodes
    //      A, B, C, D... Subtrees
    //
    //          g
    //         / \             x
    //        p   D          /   \
    //       / \      =>    p     g
    //      A   x          / \   / \
    //         / \        A   B C   D
    //        B   C

    //Preorchestrate animation on the current positions
    //execute animations as two zig rotations
    //
    //1. Zag x
    //1.1 move x to p (up)
    //1.2 move p to A (down)
    //1.3 move A to p.left (down)
    //1.4 move B to p.right (left)
    //1.5 move C to x.right (up)
    //2. Zig x
    //2.1 move x to g (up)
    //2.2 move g to D (down)
    //2.3 move D to g.right (down)
    //2.4 move C to g.left (right)
    //2.5 move p to x.left (up)
    //3. Redraw lines (FIN)


    //CREATING DATA FIELDS

    let sourceNode = nodeToRotate
    let parentNode = nodeToRotate.parent;
    let grandParentNode = nodeToRotate.parent.parent;

    //granparent is the highest in the list, so the search is quickest
    let grandparent_y_level = grandParentNode.level()
    let parent_y_level = grandparent_y_level + 1
    let source_y_level = parent_y_level + 1

    let idSource = "#node_" + sourceNode.value;
    let idSource_text = "#node_" + sourceNode.value + "_text";

    let idParent = "#node_" + parentNode.value;
    let idParent_text = "#node_" + parentNode.value + "_text";

    let idGParent = "#node_" + grandParentNode.value;
    let idGParent_text = "#node_" + grandParentNode.value + "_text";

    /// ANIMATION VALUES DEFINITIONS
    let nodeToAnimate;
    let textToAnimate;
    let targetNode;
    let targetText;
    let target_xpos;
    let target_ypos;
    let left_child_xpos;
    let left_child_ypos;
    let downNode;
    let leftNode;
    let upNode;
    let bridgeNode;
    let bridgeText;
    let y_level;

    /// ANIMATION START

    //Zig parent to destination
    //1. Zag x

    //get nodes to animate (parent, grandparent)
    nodeToAnimate = SVG(idSource)
    textToAnimate = SVG(idSource_text)

    targetNode = SVG(idParent)
    targetText = SVG(idParent_text)

    //target (grandparent) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //1.1 move x to p (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move
    y_level = parent_y_level;

    //1.2 move p to A (down)
    left_child_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    //1.3 move A to p.left (down)
    downNode = parentNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "left")

    //1.4 move B to p.right (left)
    leftNode = sourceNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, leftNode, y_level + 2, left_child_xpos, "right")

    //1.5 move C to x.right (up)
    upNode = sourceNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "right")

    //zig target to destination
    //2. Zig x

    //get nodes to animate (source, parent)
    nodeToAnimate = SVG(idSource)
    textToAnimate = SVG(idSource_text)

    bridgeNode = SVG(idParent)
    bridgeText = SVG(idParent_text)

    targetNode = SVG(idGParent)
    targetText = SVG(idGParent_text)

    //target (still grandparent, since animation didn't play yet) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //2.1 move x to g (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move
    y_level = grandparent_y_level;

    //2.2 move g to D (down)
    left_child_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    //2.3 move D to g.right (down)
    downNode = grandParentNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "right")

    //2.4 move C to g.left (right)
    leftNode = sourceNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, leftNode, y_level + 2, left_child_xpos, "left")

    //2.5 move p to x.left (up)
    left_child_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    moveTo(bridgeNode, bridgeText, timeline, start_time, left_child_xpos, left_child_ypos);

    //2.6 move A to p.left (up)
    upNode = parentNode.leftChild;
    moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 2, left_child_xpos, "left")

    //2.7 move B to p.right (up)
    upNode = sourceNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 2, left_child_xpos, "right")

    //3. Redraw lines (FIN)
    return start_time;
}

function zigzag(nodeToRotate, timeline, start_time) {
    console.log("zigzag rotation");

    //      x, p, g... Nodes
    //      A, B, C, D... Subtrees
    //
    //          g
    //         / \             x
    //        A   p          /   \
    //           / \    =>  g     p
    //          x   D      / \   / \
    //         / \        A   B C   D
    //        B   C

    //Preorchestrate animation on the current positions
    //execute animations as two zig rotations
    //
    //1. Zig x
    //1.1 move x to p (up)
    //1.2 move p to D (down)
    //1.3 move D to p.right (down)
    //1.4 move C to p.left (right)
    //1.5 move B to x.left (up)
    //2. Zag x
    //2.1 move x to g (up)
    //2.2 move g to A (down)
    //2.3 move A to g.left (down)
    //2.4 move B to g.right (left)
    //2.5 move p to x.right (up)
    //2.6 move D to p.right (up)
    //2.7 move C to p.left (up)
    //3. Redraw lines (FIN)

    //CREATING DATA FIELDS

    let sourceNode = nodeToRotate
    let parentNode = nodeToRotate.parent;
    let grandParentNode = nodeToRotate.parent.parent;

    //granparent is the highest in the list, so the search is quickest
    let grandparent_y_level = grandParentNode.level()
    let parent_y_level = grandparent_y_level + 1
    let source_y_level = parent_y_level + 1

    let idSource = "#node_" + sourceNode.value;
    let idSource_text = "#node_" + sourceNode.value + "_text";

    let idParent = "#node_" + parentNode.value;
    let idParent_text = "#node_" + parentNode.value + "_text";

    let idGParent = "#node_" + grandParentNode.value;
    let idGParent_text = "#node_" + grandParentNode.value + "_text";

    /// ANIMATION VALUES DEFINITIONS
    let nodeToAnimate;
    let textToAnimate;
    let targetNode;
    let targetText;
    let target_xpos;
    let target_ypos;
    let left_child_xpos;
    let left_child_ypos;
    let downNode;
    let leftNode;
    let upNode;
    let bridgeNode;
    let bridgeText;
    let y_level;

    /// ANIMATION START

    //Zig parent to destination
    //1. Zig x

    //get nodes to animate (parent, grandparent)
    nodeToAnimate = SVG(idSource)
    textToAnimate = SVG(idSource_text)

    targetNode = SVG(idParent)
    targetText = SVG(idParent_text)

    //target (grandparent) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //1.1 move x to p (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move
    y_level = parent_y_level;

    //1.2 move p to D (down)
    left_child_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    //1.3 move D to p.right (down)
    downNode = parentNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "right")

    //1.4 move C to p.left (right)
    leftNode = sourceNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, leftNode, y_level + 2, left_child_xpos, "left")

    //1.5 move B to x.left (up)
    upNode = sourceNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "left")

    //zig target to destination
    //2. Zag x

    //get nodes to animate (source, parent)
    nodeToAnimate = SVG(idSource)
    textToAnimate = SVG(idSource_text)

    bridgeNode = SVG(idParent)
    bridgeText = SVG(idParent_text)

    targetNode = SVG(idGParent)
    targetText = SVG(idGParent_text)

    //target (still grandparent, since animation didn't play yet) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");
    y_level = grandparent_y_level;

    //2.1 move x to g (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move

    //2.2 move g to A (down)
    left_child_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    //2.3 move A to g.left (down)
    downNode = grandParentNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "left")

    //2.4 move B to g.right (left)
    leftNode = sourceNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, leftNode, y_level + 2, left_child_xpos, "right")

    //2.5 move p to x.right (up)
    left_child_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    moveTo(bridgeNode, bridgeText, timeline, start_time, left_child_xpos, left_child_ypos);

    //2.6 move D to p.right (up)
    upNode = parentNode.rightChild;
    moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 2, left_child_xpos, "right")

    //2.7 move C to p.left (up)
    upNode = sourceNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 2, left_child_xpos, "left")

    //3. Redraw lines (FIN)
    return start_time;
}

function moveSubTree_recursionStart(timeline, start_time, node, y_level, target_xpos,  side = "left" ){
    if (node !== null) {
        let id = "#node_" + node.value;
        let id_text = "#node_" + node.value + "_text";
        let subtree_xpos = target_xpos;
        if(side === "left")
            subtree_xpos -= width / Math.pow(2, y_level + 1);
        else if(side = "right")
            subtree_xpos += width / Math.pow(2, y_level + 1);

        let subtree_ypos = y_level * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
        start_time = moveSubTree(node, SVG(id), SVG(id_text), timeline, start_time, y_level, subtree_xpos, subtree_ypos);
    }

    return start_time;
}

function moveSubTree(node, circle, text, timeline, start_time, y_level, pos_x, pos_y){

    moveTo(circle, text, timeline, start_time, pos_x, pos_y);

    //leftChild
    let leftNode = node.leftChild;
    if(leftNode !== null){
        let idLeft = "#node_" + leftNode.value;
        let idLeft_text = "#node_" + leftNode.value + "_text";
        let target_xpos = pos_x - width/Math.pow(2, (y_level+1)+1);
        let target_ypos =(y_level+1)*CIRCLE_DIAMETER*5+(MARGIN_TOP);
        moveSubTree(leftNode, SVG(idLeft), SVG(idLeft_text), timeline, start_time, y_level+1, target_xpos, target_ypos);

    }

    //rightChild
    let rightNode = node.rightChild;
    if(rightNode !== null){
        let idRight = "#node_" + rightNode.value;
        let idRight_text = "#node_" + rightNode.value + "_text";
        let target_xpos = pos_x + width/Math.pow(2, (y_level+1)+1);
        let target_ypos =(y_level+1)*CIRCLE_DIAMETER*5+(MARGIN_TOP);
        moveSubTree(rightNode, SVG(idRight), SVG(idRight_text), timeline, start_time, y_level+1, target_xpos, target_ypos);

    }

    return start_time+1000;
}

function moveTo(circle, text, timeline, start_time, pos_x, pos_y){

    circle.timeline(timeline)
    text.timeline(timeline)

    circle.animate(1000, start_time, "absolute" ).center(pos_x, pos_y);
    text.animate(1000, start_time, "absolute" ).center(pos_x, pos_y);

    return start_time+1000

}