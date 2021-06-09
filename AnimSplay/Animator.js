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

    //setup timeline
    let is_left_child = (sourceNode.parent.leftChild === sourceNode)
    switch(step){
        case "ZIG":
            if(is_left_child) start_time = rotation_right(sourceNode, timeline, start_time)
            else start_time = rotation_left(sourceNode, timeline, start_time)
            break;
        case "ZIGZIG":
            if(is_left_child) {
                start_time = rotation_right(sourceNode.parent, timeline, start_time)
                start_time = rotation_right(sourceNode, timeline, start_time)
            }
            else {
                start_time = rotation_left(sourceNode.parent, timeline, start_time)
                start_time = rotation_left(sourceNode, timeline, start_time)
            }
            break;
        case "ZIGZAG":
            if(is_left_child){
                start_time = rotation_right(sourceNode, timeline, start_time)
                start_time = rotation_left(sourceNode, timeline, start_time)
            }
            else {
                start_time = rotation_left(sourceNode, timeline, start_time)
                start_time = rotation_right(sourceNode, timeline, start_time)
            }
            break;
    }

}

function finish_animation(){
    timeline = new SVG.Timeline()
    start_time = 0
}

function rotation_left(nodeToRotate, timeline, start_time) {
    console.log("left rotation");

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
    if (downNode !== null) {
        let idChildDest = "#node_" + downNode.value;
        let idChildDest_text = "#node_" + downNode.value + "_text";
        let left_child_subtree_xpos = left_child_xpos - width / Math.pow(2, (y_level + 1) + 2);
        let left_child_subtree_ypos = ((y_level + 1) + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
        start_time = moveSubTree(downNode, SVG(idChildDest), SVG(idChildDest_text), timeline, start_time, y_level + 2, left_child_subtree_xpos, left_child_subtree_ypos);
    }

    ////src leftchild + subtree -> move left
    let leftNode = nodeToRotate.leftChild;
    if (leftNode !== null) {
        let idleft = "#node_" + leftNode.value;
        let idLeft_text = "#node_" + leftNode.value + "_text";
        let leftSubtree_xpos = left_child_xpos + width / Math.pow(2, (y_level + 2) + 1);
        let leftSubtree_ypos = (y_level + 2) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
        start_time = moveSubTree(leftNode, SVG(idleft), SVG(idLeft_text), timeline, start_time, y_level + 2, leftSubtree_xpos, leftSubtree_ypos);
    }

    ////src rightchild + subtree -> move up
    let upNode = nodeToRotate.rightChild;
    if (upNode !== null) {
        let idUp = "#node_" + upNode.value;
        let idUp_text = "#node_" + upNode.value + "_text";
        let upSubtree_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
        let upSubtree_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
        start_time = moveSubTree(upNode, SVG(idUp), SVG(idUp_text), timeline, start_time, y_level + 1, upSubtree_xpos, upSubtree_ypos);
    }

    return start_time
}

function rotation_right(nodeToRotate, timeline, start_time) {
    console.log("right rotation");
    console.log(nodeToRotate)
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
    if (downNode !== null) {
        let idChildDest = "#node_" + downNode.value;
        let idChildDest_text = "#node_" + downNode.value + "_text";
        let left_child_subtree_xpos = left_child_xpos + width / Math.pow(2, (y_level + 1) + 2);
        let left_child_subtree_ypos = ((y_level + 1) + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
        start_time = moveSubTree(downNode, SVG(idChildDest), SVG(idChildDest_text), timeline, start_time, y_level + 2, left_child_subtree_xpos, left_child_subtree_ypos);
    }

    ////src rightchild + subtree -> move right
    let leftNode = nodeToRotate.rightChild;
    if (leftNode !== null) {
        let idleft = "#node_" + leftNode.value;
        let idLeft_text = "#node_" + leftNode.value + "_text";
        let leftSubtree_xpos = left_child_xpos - width / Math.pow(2, (y_level + 2) + 1);
        let leftSubtree_ypos = (y_level + 2) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
        start_time = moveSubTree(leftNode, SVG(idleft), SVG(idLeft_text), timeline, start_time, y_level + 2, leftSubtree_xpos, leftSubtree_ypos);
    }

    ////src leftchild + subtree -> move up
    let upNode = nodeToRotate.leftChild;
    if (upNode !== null) {
        let idUp = "#node_" + upNode.value;
        let idUp_text = "#node_" + upNode.value + "_text";
        let upSubtree_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
        let upSubtree_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
        start_time = moveSubTree(upNode, SVG(idUp), SVG(idUp_text), timeline, start_time, y_level + 1, upSubtree_xpos, upSubtree_ypos);
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