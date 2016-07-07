const directiveRe = /@module\s+(['"])([^'"]+)\1\s+=>\s+([^;]+);?$/mg;
//                             $1    $2                $3
// $1: quote
// $2: source path
// $3: variable name
//
// Directive syntax: `@module './comp.scss' => $comp`

const outputRe = /exports\.locals\s*=\s*([^;]+);?/;
//                                      $1: js object
// Example output:
//    exports.locals = {
//      "test": "src-example-___style__test___2lVz0"
//    };

module.exports = {
  directive: directiveRe,
  output: outputRe,
};
