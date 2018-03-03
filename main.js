(function(){
    const MAX_BYTES = 8 * 10 ** 6;
    const MAX_WIDTH = 1280;
    const MAX_HEIGHT = 1280;

    let input = document.querySelector('input[type=file]');
    function load_image(url){
        let p = new Promise(resolve => {
            let image = new Image();
            image.src = url;
            image.crossOrigin = 'anonymous';
            image.onload = () => resolve(image);
        })
        return p;
    }
    async function compress_optimally(canvas){
        let found = false;
        let quality = 1;
        while(!found){
            console.log(quality);
            let blob = await compress(canvas, quality);
            if(blob.size <= MAX_BYTES){
                console.log(quality);
                return blob;
            }
            quality -= 0.01;
        }
    }
    function compress(canvas, quality){
        return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    }
    function fit_to_bounds(image){
        let width = image.naturalWidth;
        let height = image.naturalHeight;
        const x_ratio = width / MAX_WIDTH;
        const y_ratio = height / MAX_HEIGHT;

        if(x_ratio > 1 || y_ratio > 1){
            return scale_down(image, Math.max(x_ratio, y_ratio));
        }
        else {
            document.createElement('canvas');
        }
    }
    function scale_down(source, target_ratio){
        target_ratio = 1/target_ratio;
        let current_ratio = 1;

        const canvas = document.createElement('canvas');

        const source_width = source.naturalWidth;
        const source_height = source.naturalHeight;
        let width = source_width;
        let height = source_height;
        let target_width = Math.floor(source_width * target_ratio);
        let target_height = Math.floor(source_height * target_ratio);

        canvas.height = height;
        canvas.width = width;

        let ctx = canvas.getContext('2d');

        ctx.drawImage(source, 0, 0);

        while(current_ratio - 0.1 > target_ratio){
            let new_ratio = current_ratio - 0.1;
            let new_width = source_width * new_ratio;
            let new_height = source_height * new_ratio;
            ctx.drawImage(canvas, 0, 0, width, height, 0, 0, new_width, new_height);
            current_ratio = new_ratio;
            width = new_width;
            height = new_height;
        }

        const result = document.createElement('canvas');
        result.width = target_width;
        result.height = target_height;
        result.getContext('2d').drawImage(canvas, 0, 0, width, height, 0, 0, target_width, target_height);

        document.body.appendChild(canvas);
        document.body.appendChild(result);

        {
            let url = canvas.toDataURL('image/png');
            console.log(url);
            let img = document.createElement('img');
            img.src = url;
            document.body.appendChild(img);
        }
        {
            let url = result.toDataURL('image/png');
            console.log(url);
            let img = document.createElement('img');
            img.src = url;
            document.body.appendChild(img);

        }

        return result
    }
    async function acceptFile(){
        let file = input.files[0];
        let url = URL.createObjectURL(file);
        let image = await load_image(url);
        let buffer = fit_to_bounds(image);
        let blob = await compress_optimally(buffer);
        document.querySelector('img').src = URL.createObjectURL(blob);
    }
    input.addEventListener('change', acceptFile);

})();
