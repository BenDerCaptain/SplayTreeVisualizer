function middle(number){
    return Math.floor(number / 2) + 1
}


class SplayNode{
    value = 0;
    parent = null
    leftChild = null;
    rightChild = null;


    constructor(parent, value) {
        this.value = value;
        this.parent = parent;
    }

    static generate(parent, startVal, endVal){
        var size = endVal - startVal + 1;
        var mid = middle(size);

        var node = new SplayNode(parent, startVal + mid - 1);

        var leftEnd = node.value - 1;
        var rightStart = node.value + 1;

        if(startVal <= leftEnd) node.leftChild = SplayNode.generate(node,startVal,leftEnd);
        if(rightStart <= endVal) node.rightChild = SplayNode.generate(node, rightStart, endVal);

        return node;
    }

    set rightChild(node){
        this.rightChild = node;
    }
    set leftChild(node){
        this.leftChild = node;
    }
    set parent(node){
        this.parent = node;
    }
    set value(val){
        this.value = val;
    }

    get rightChild(){
        return this.rightChild;
    }
    get leftChild(){
        return this.leftChild;
    }
    get parent(){
       return this.parent;
    }
    get value(){
        return this.value;
    }

    depth() {
        let lDepth = this.leftChild  === null ? 0 : this.leftChild.depth()
        let rDepth = this.rightChild === null ? 0 : this.rightChild.depth()

        return rDepth > lDepth ? rDepth + 1 : lDepth + 1;
    }

    level() {
        return this.parent === null ? 0 : this.parent.level() + 1;
    }

    static greater(nodeA, nodeB){
        return nodeA.value > nodeB.value;
    }

    static lesser(nodeA, nodeB){
        return nodeA.value < nodeB.value;
    }

    static equals(nodeA, nodeB){
        return nodeA.value === nodeB.value;
    }

   static getTs(level){
       var s = ""
       for(let i=0; i<level; i++)
           s+="\t";
       return s;
   }

   static print(node, level){
        if(node.leftChild){
            SplayNode.print(node.leftChild, level+1);
        }

       console.log(this.getTs(level) + "Value: " + node.value);

        if(node.rightChild){
            SplayNode.print(node.rightChild, level+1);
        }
   }

}

class SplayTree{

    root = null;

    constructor(amount) {
        this.generate(amount)
    }

    generate(size){
        this.root = SplayNode.generate(null, 1, size)
    }

    getCommonAncestor(nodeA, nodeB){
        var ancestor = this.root;

        let leftNode = SplayNode.lesser(nodeA, nodeB) ? nodeA : nodeB;
        let rightNode = !SplayNode.equals(leftNode, nodeA) ? nodeA : nodeB;

        let leftCorrect = SplayNode.lesser(leftNode, ancestor) || SplayNode.equals(leftNode, ancestor);
        let rightCorrect = SplayNode.lesser(ancestor, rightNode)|| SplayNode.equals(ancestor, rightNode);

        while(!(leftCorrect && rightCorrect)){
            if(!leftCorrect){
                ancestor = ancestor.rightChild;
            }
            else if(!rightCorrect){
                ancestor = ancestor.leftChild;
            }

            leftCorrect = SplayNode.lesser(leftNode, ancestor) || SplayNode.equals(leftNode, ancestor);
            rightCorrect = SplayNode.lesser(ancestor, rightNode)|| SplayNode.equals(ancestor, rightNode);
        }
        return ancestor
    }

    isChild(parent, node){
        return parent.leftChild === node || parent.rightChild === node;

    }

    getNodeByValue(value){
        var node = this.root;
        while(node.value !== value){
            if(value > node.value)
                node = node.rightChild;
            else if(value < node.value)
                node = node.leftChild;
        }
        return node;
    }

    getNextRotationStep(src, dest){
        if(SplayNode.equals(src,dest))
            return "DONE";
        else if(SplayNode.equals(src.parent, dest))
            return "ZIG";
        else if((SplayNode.greater(src, src.parent) && SplayNode.greater(src.parent, src.parent.parent)) ||
                 SplayNode.greater(src.parent, src) && SplayNode.greater(src.parent.parent, src.parent))
            return "ZIGZIG";
        else
            return "ZIGZAG";
    }

    rotate(type, node){
        switch (type){
            case "ZIG":
                this.zig(node)
                break;
            case "ZIGZIG":
                this.zigzig(node)
                break;
            case "ZIGZAG":
                this.zigzag(node)
                break;
        }
    }

    depth(){
        return this.root.depth()
    }

    zig(src){
        let dest = src.parent;
        src.parent = dest.parent;
        dest.parent = src;

        if(src.parent === null)
            this.root = src;
        else if(SplayNode.greater(src, src.parent)) {
            src.parent.rightChild = src;
        }else {
            src.parent.leftChild = src;
        }

        let tempChild;
        //source as left child of dest (ZIG)
        if(SplayNode.greater(dest, src)){
            tempChild = src.rightChild;
            src.rightChild = dest;
            dest.leftChild = tempChild;
            if(tempChild !== null) dest.leftChild.parent = dest;
        }

        //source as right child of dest (ZAG)
        else if(SplayNode.greater(src, dest)){
            tempChild = src.leftChild;
            src.leftChild = dest;
            dest.rightChild = tempChild;
            if(tempChild !== null) dest.rightChild.parent = dest;
        }
    }

    zigzig(src){
        //console.log(src.parent)
        let is_left_child = (src.parent.leftChild === src)

        //zig parent and parent's parent
        this.zig(src.parent)

        //zig src and parent
        this.zig(src)
    }

    zigzag(src){
        let is_left_child = (src.parent.leftChild === src)

        //zig src and parent
        this.zig(src)

        //zig parent and parent's parent
        this.zig(src)
    }

    printOut(){
        SplayNode.print(this.root, 0);
    }


}
