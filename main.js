(function(){
    const MAX_BYTES = 8 * 10 ** 6;
    const MAX_WIDTH = 1280;
    const MAX_HEIGHT = 1280;

    function load_image(url){
        // takes an image url and returns an HTMLImageElement when it is
        // successfully loaded
        // or rejects if it fails
        let p = new Promise((resolve, reject) => {
            let image = new Image();
            image.src = url;
            image.crossOrigin = 'anonymous';
            image.onload = () => resolve(image);
            image.onerror = reject;
        })
        return p;
    }
    async function compress_optimally(canvas){
        // takes a canvas and returns a JPEG version of this image as a Blob,
        // compressed to fit within MAX_BYTES
        let found = false;
        let quality = .95;
        while(!found){
            let blob = await compress(canvas, quality);
            if(blob.size <= MAX_BYTES){
                return blob;
            }
            quality -= 0.01;
        }
    }
    function compress(canvas, quality){
        // takes a canvas and a quality within [0, 1] and returns a JPEG within a Blob
        return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    }
    function fit_to_bounds(image){
        // takes an HTMLImageElement and returns a canvas with the image resized to fit
        // within MAX_HEIGHT and MAX_WIDTH
        let width = image.naturalWidth;
        let height = image.naturalHeight;
        const x_ratio = width / MAX_WIDTH;
        const y_ratio = height / MAX_HEIGHT;

        if(x_ratio > 1 || y_ratio > 1){
            return scale_down(image, Math.max(x_ratio, y_ratio));
        }
        else {
            const canvas = document.createElement('canvas');
            canvas.height = height;
            canvas.width = width;
            canvas.getContext('2d').drawImage(image, 0, 0);
            return canvas;
        }
    }
    function scale_down(source, target_ratio){
        // takes an HTMLImageElement and a ratio to scale it down by and returns a canvas with the resized image
        // (eg target_ratio = 2 means output will be 1/2 as wide and tall)
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

        return result
    }
    async function to_url(file){
        // takes a Blob (or File) and returns a blob: url for it
        return URL.createObjectURL(file);
    }
    async function acceptFile(file){
        let url = await to_url(file);
        let image = await load_image(url);
        let buffer = fit_to_bounds(image);
        let blob = await compress_optimally(buffer);
        let a = document.createElement('a');
        a.download = 'resized.jpg';
        a.href = await to_url(blob);
        let click_event = new MouseEvent('click');
        a.dispatchEvent(click_event);

        //document.querySelector('img').src = URL.createObjectURL(blob);
    }

    async function acceptFiles(files){
        return await Promise.all(files.map(acceptFile));
    }

    let input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    // TODO handle case where zero files were selected
    input.addEventListener('change', () => {
        acceptFiles(Array.from(input.files));
        input.value = null;
    });

    let button = document.querySelector('#browse-button');
    button.addEventListener('click', () => {
        let click_event = new MouseEvent('click');
        input.dispatchEvent(click_event);
    });

    function dataTransferToFiles(dt){
        return Array.from(dt.items)
            .filter(item => item.kind == 'file')
            .map(item => item.getAsFile())
    }

    button.addEventListener('drop', event => {
        event.preventDefault();

        let files = dataTransferToFiles(event.dataTransfer);
        acceptFiles(files);
        button.classList.remove('dragover');
    });

    button.addEventListener('dragover', event =>
        event.preventDefault()
    );

    button.addEventListener('dragenter', () =>
        button.classList.add('dragover')
    );


    button.addEventListener('dragleave', () =>
        button.classList.remove('dragover')
    );

    document.body.addEventListener('paste', event => {
        event.preventDefault();
        let files = dataTransferToFiles(event.clipboardData);
        acceptFiles(files);
    });



    // serviceworker registration
    if('serviceWorker' in navigator){
        navigator.serviceWorker.register('./serviceworker.js');
    }

})();
