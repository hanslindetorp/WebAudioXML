XML = {
    parse: (string, type = 'text/xml') => new DOMParser().parseFromString(string, type),  // like JSON.parse
    stringify: DOM => new XMLSerializer().serializeToString(DOM),                         // like JSON.stringify

    transform: (xml, xsl) => {
        let proc = new XSLTProcessor();
        proc.importStylesheet(typeof xsl == 'string' ? XML.parse(xsl) : xsl);
        let output = proc.transformToFragment(typeof xml == 'string' ? XML.parse(xml) : xml, document);
        return typeof xml == 'string' ? XML.stringify(output) : output; // if source was string then stringify response, else return object
    },

    minify: node => XML.toString(node, false),
    prettify: node => XML.toString(node, true),
    toString: (node, pretty, level = 0, singleton = false) => { // einzelkind
        if (typeof node == 'string') node = XML.parse(node);
        let tabs = pretty ? Array(level + 1).fill('').join('\t') : '';
        let newLine = pretty ? '\n' : '';
        if (node.nodeType == 3) return (singleton ? '' : tabs) + node.textContent.trim() + (singleton ? '' : newLine)
        if (!node.tagName) return XML.toString(node.firstChild, pretty);
        let output = tabs + `<${node.tagName}`; // >\n
        for (let i = 0; i < node.attributes.length; i++)
            output += ` ${node.attributes[i].name}="${node.attributes[i].value}"`;
        if (node.childNodes.length == 0) return output + ' />' + newLine;
        else output += '>';
        let onlyOneTextChild = ((node.childNodes.length == 1) && (node.childNodes[0].nodeType == 3));
        if (!onlyOneTextChild) output += newLine;
        for (let i = 0; i < node.childNodes.length; i++)
            output += XML.toString(node.childNodes[i], pretty, level + 1, onlyOneTextChild);
        return output + (onlyOneTextChild ? '' : tabs) + `</${node.tagName}>` + newLine;
    }
}

