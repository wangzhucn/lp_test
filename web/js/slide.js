;( function( $, window, document, undefined ){
	var bamSlider = 'bamSlider';
	var defaultOptions = {
		auto : false,
		indicator : true,
		arrow : true,
		//thumbnail : false,
		touch : true,
		interval : 4000,
		duration : 300,
		context : false,
		loop : true,
		contextRate : 0.25
		// onMoved : function(n){},
		// onStartMove : function(n){},
	};

	function Slider( element, options ){
        this.indecatorArr = [];
        this.$indecatorArr = undefined;
        this.$viewpoint = $('<div class="bam_slide_viewpoint">');
        this.$slideContainer = $('<div class="bam_slide_container">');
        this.$indicatorContianer = $('<div class="bam_indecator_container">');
        this.$arrowNext = $('<a class="bam_arrow_next">');
        this.$arrowPrev = $('<a class="bam_arrow_prev">');
        this.indicatorTemplate = '<li class="indicator">';
        this.current = 0;
        this.bufferSize = 2;
        this.isMoving = false;
        this.isTouching = false;
        this.intervalObj = {};

		this.$element = $(element);
		this.$LI_ARR = this.$element.find('li');
		this.LENGTH = this.$LI_ARR.length;
		this.$UL = this.$element;
		this.$BACKUP = this.$UL.clone();
		this.$parent = this.$element.parent();
		this.width = this.$UL.width();
		

        if(options){
			for(var key in defaultOptions){
				if(typeof options[key] !== typeof defaultOptions[key])
					options[key] = defaultOptions[key];
			}
		}else{
			options = defaultOptions;
		}
		this.DURATION = options.duration;
        this.WIDTH_RATE = options.context ? 1 - options.contextRate : 1;
		this.init(options);
		window.test = this.$element;
	}
	Slider.prototype.init = function init(options){
        var self = this;
		this.api ={
			toNext : this.moveForward.bind(this, options.loop),
			toPrev : this.moveBackward.bind(this, options.loop),
			jumpTo : this.moveTo.bind(this),
			startSlide : this.start.bind(this, options.interval, options.loop),
			stopSlide : this.stop.bind(this),
			destroy : this.destroy.bind(this)
		};

		/* dom */
		if(this.LENGTH <= 1)
			return;
		if(this.LENGTH < 4 && options.context)
			options.loop = false;
		this.$LI_ARR.width(this.width).css({'margin' : 0});
		this.$parent.append(
			this.$viewpoint.append(
                this.$slideContainer.wrapInner(this.$UL).width(this.width * this.LENGTH)
			).append(
                this.$indicatorContianer
			)
		);
		this.onResize(options.context);
		
		this.setViewPointHeightToFit(this.current);
		if(options.loop) this.setBuffer();
		if(options.arrow){
            this.$arrowPrev.appendTo(this.$viewpoint).on('click', this.moveBackward.bind(this, options.loop));
            this.$arrowNext.appendTo(this.$viewpoint).on('click', this.moveForward.bind(this, options.loop));
		}

		/* onResize */
		$(window).on('resize', this.onResize.bind(self));

		/* set indicator */
		if(options.indicator)
            this.setIndicator(options.loop);
		/* auto */
		if(options.auto)
            this.start(options.interval, options.loop);
		/* touch */
		if(options.touch)
            this.bindTouchEvent(options.auto ? options.interval : undefined, options.loop);

        this.moveTo(this.current, null, options.loop);
	};
	Slider.prototype.moveForward = function moveForward(isLoop){
        this.moveTo((this.current + 1 + this.LENGTH)%this.LENGTH, 'F', isLoop);
	};

	Slider.prototype.moveBackward = function moveBackward(isLoop){
        this.moveTo((this.current - 1 + this.LENGTH)%this.LENGTH, 'B', isLoop);
	};

	Slider.prototype.stop = function stop(){
        clearInterval(this.intervalObj);
	};

	Slider.prototype.start = function start(interval, isLoop){
        this.intervalObj = setInterval(this.moveForward.bind(this, isLoop), interval);
	};

	Slider.prototype.setIndicator = function setIndicator(isLoop){
		var $inner = $('<ul>').appendTo(this.$indicatorContianer);
        var self = this;
		$.each(this.$LI_ARR, function(i){
            self.indecatorArr.push(
				$(self.indicatorTemplate).appendTo($inner).on('click', function(){
                    self.moveTo(i, undefined, isLoop);
				})
			);
		});
        this.$indecatorArr = $inner.find('li');
		$(this.indecatorArr[this.current]).addClass('current');
	};

	 	//end may be greater then this.LENGTH
	Slider.prototype.setElementSequence = function setElementSequence(start, end){
		if(end - start > 0){
            var $base, curr, i;
            $base = $(this.$LI_ARR[start]);
			for (i = start + 1; i <= end; i++) {
				curr = this.$LI_ARR[(i+this.LENGTH)%this.LENGTH];
				if($base.next()[0] !== curr){
					$base.after(curr);
                    this.setContainerLeft();
				}
				$base = $(curr);
			}
		}else if(start -end > 0){
			$base = $(this.$LI_ARR[start]);
			for (i = start - 1; i >= end; i--) {
				curr = this.$LI_ARR[(i+this.LENGTH)%this.LENGTH];
				if($base.prev()[0] !== curr){
					$base.before(curr);
                    this.setContainerLeft();
				}
				$base = $(curr);
			}
		}
	};
		
	Slider.prototype.onResize = function onResize(){
		this.width = this.$viewpoint.width();
		var margin = 10;
        this.width = this.width * this.WIDTH_RATE;
        this.$LI_ARR.stop('on', 'off').css({
            width: this.width - 2 * margin,
            'margin-left': margin,
            'margin-right': margin
        });
        this.$slideContainer.stop('on', 'off').css({width : this.width * this.LENGTH});
        this.setContainerLeft()
	};

	Slider.prototype.setBuffer = function setBuffer(){
		if( this.bufferSize * 2 + 1 > this.LENGTH ){
            this.bufferSize = this.LENGTH / 2;
		}
        this.setElementSequence(this.current, this.current-this.bufferSize);
        this.setElementSequence(this.current, this.current+this.bufferSize);
	};

	Slider.prototype.moveTo = function moveTo(dest, direction, isLoop){
        var self = this;
        if(!this.$LI_ARR[dest] || this.isMoving || this.isTouching)
			return;
		if(this.LENGTH == 2){
			if(direction == 'F')
                this.setElementSequence(this.current, this.current+1);
			else
                this.setElementSequence(this.current, this.current-1)
		}else{
			if(!direction) this.setElementSequence(this.current, dest);
		}
		this.$LI_ARR.removeClass('current');
        if(this.$indecatorArr)
            this.$indecatorArr.removeClass('current');
        this.isMoving = true;
        this.setViewPointHeightToFit(dest, true);
        this.current = dest;
		$(this.$LI_ARR[this.current]).addClass('current');
        this.smoothSetContainerLeft(undefined,undefined, function(){
            self.isMoving = false;
            if(self.$indecatorArr)
                $(self.indecatorArr[self.current]).addClass('current');
			if(self.LENGTH > 2 && isLoop)
                self.setBuffer();
		});
		// function getLeftOffset(){
		// 	return -$(this.$LI_ARR[dest]).position().left;
		// }
	};

	Slider.prototype.destroy = function destroy(){
		this.$viewpoint.remove();
		this.$BACKUP.appendTo(this.$parent);
	}
	Slider.prototype.smoothSetContainerLeft = function(v, durition, cb) {
		durition = durition || this.DURATION;
		this.$slideContainer.animate({transform : 'translateX(' + (v !== undefined ? v : -this.getCurrentLiLeft()) + 'px)' }, durition, cb);
	};
	Slider.prototype.setContainerLeft = function setContainerLeft(v){
		var ___ = this.$slideContainer
        this.$slideContainer
        	// .off("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd")
        	.css({transform : 'translateX(' + (v !== undefined ? v : -this.getCurrentLiLeft()) + 'px)' })
        // if(typeof cb === 'function')cb()
        // this.$slideContainer.animate({left : (v !== undefined ? v : -this.getCurrentLiLeft()) },isAnimate ? (durition ? durition : this.DURATION) : 0, cb);
	};

	Slider.prototype.setViewPointHeightToFit = function setViewPointHeightToFit(n, isAnimate, durition){

        this.$viewpoint.animate({height : $(this.$LI_ARR[n]).height()+50}, isAnimate ? (durition ? durition : this.DURATION/2) : 0);

	};

	Slider.prototype.getCurrentLiLeft = function getCurrentLiLeft(){
		return $(this.$LI_ARR[this.current]).position().left - this.width * 1 / this.WIDTH_RATE * ( 1 - this.WIDTH_RATE ) / 2;
	};

	Slider.prototype.bindTouchEvent = function bindTouchEvent(interval, isLoop){
		if( !('ontouchstart' in window) ){
			console.warn('touch event is not supported by browser');
			return;
		}
		var startPos;
		var startLeft;
		var vDiff;
		var hDiff
		var THRESHOLD = 0.1;
		var SPEED_RATE = 0.5;
		var BUFFER = this.width * 0.5;
        var self = this;
        var direction = 'N';

        // var float = $('<p id="float">').css({'position': 'fixed','width': 20,'height': 20,'left':0,top:0,'z-index':1000000}).appendTo('body');
        this.$slideContainer.on('touchstart',function(e){
        	if(self.isMoving)
				return;
        	self.stop();
     		self.$arrowNext.hide();
     		self.$arrowPrev.hide();
			if( self.LENGTH == 2 ){
                self.setElementSequence(0 , 1);
			}
            self.isTouching = true;
			startPos = {
				pageX : e.originalEvent.touches[0].pageX,
				pageY : e.originalEvent.touches[0].pageY
			};

			startLeft = self.getCurrentLiLeft();
		});
        this.$slideContainer.on('touchmove',function(e){
			if(self.isMoving)
				return;
			// float.text(e.originalEvent.touches[0].pageX);

			hDiff = e.originalEvent.touches[0].pageX - startPos.pageX;
			vDiff = e.originalEvent.touches[0].pageY - startPos.pageY;
			if(direction === 'H'){
				e.preventDefault();
			}else if(direction === 'V'){
				return hDiff = vDiff =0;
			}else{
				direction = Math.abs(hDiff) >= Math.abs(vDiff) ? 'H' : 'V';
			}
            if( ( self.LENGTH == 2 || !isLoop ) && ( self.current === 0 && hDiff > 0 || self.current === self.LENGTH - 1 && hDiff < 0 ))
				if(( self.current === 0 && hDiff > BUFFER || self.current === self.LENGTH - 1 && hDiff < -BUFFER) ){
					return hDiff = 0;
				}else{
                    self.setContainerLeft(-startLeft+hDiff*SPEED_RATE);
					hDiff = 0;
				}
			else{
				self.setContainerLeft(-startLeft+hDiff*SPEED_RATE);
			}
		});
        this.$slideContainer.on('touchend', function(){
        	if(interval)
        		self.start(interval, isLoop);
            self.isTouching = false;
			if( hDiff < -THRESHOLD*self.width ){
                self.moveForward(isLoop)
			}else if( hDiff > THRESHOLD*self.width ){
                self.moveBackward(isLoop)
			}else
                self.smoothSetContainerLeft();
			hDiff = 0;
			direction = 'N';
		});
	};
	$.fn[bamSlider] = function ( options ) {
		var sliders = this.map( function (){
			var slide = $.data( this, 'plugin_' + bamSlider );
			if ( !slide ){
				slide = new Slider( this, options );
				$.data( this, 'plugin_' + bamSlider, slide );
			}
			return slide.api;
		});
		if(sliders.length > 1)
			return sliders;
		return sliders[0];
	}
})( jQuery, window, document );