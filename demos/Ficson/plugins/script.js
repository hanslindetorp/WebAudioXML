// const recursiveCall = (obj) => {
//     return new Promise((resolve) => {
//         if(obj instanceof Array){
//             let cnt = obj.length;
//             obj.forEach(el => {
//                 recursiveCall(el)
//                 .then(() => {
//                     if(!--cnt)return resolve();
//                 })
                
//             });
//         } else {
//             setTimeout(() => {
//                 console.log(obj);
//                 return resolve();
//             }, obj);
            
//         }
//     })
// }

// recursiveCall([100,50,[10,[200, 300],30],1]).then(() => console.log('done'));