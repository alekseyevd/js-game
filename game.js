'use strict';

class Vector {
	constructor(x = 0,y = 0) {
		this.x = x;
		this.y = y;
	}

	plus(newVector) {
		if (!(newVector instanceof Vector)) {
			throw new Error ('Можно прибавлять к вектору только вектор типа Vector');
		}

		return new Vector(this.x + newVector.x, this.y + newVector.y);
	}

 	times(factor) {
 		return new Vector(this.x * factor, this.y * factor);
 	}
}

class Actor {
	constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)) {
		// проверку корректности аргументов лучше перенести в начало функции
		if(!(pos instanceof Vector)) {
			throw new Error('Должен быть объект типа Vector');
		}
		if(!(size instanceof Vector)) {
			throw new Error('Должен быть объект типа Vector');
		}
		if(!(speed instanceof Vector )) {
			throw new Error('Должен быть объект типа Vector');
		}
		this.pos = pos;
		this.size = size;
		this.speed = speed;		
	}

	get left() {
		return this.pos.x;
	}
	get right() {
		return this.pos.x + this.size.x;
	}
	get top() {
		return this.pos.y;
	}
	get bottom() {
		return this.pos.y + this.size.y;
	}

	act() {}

	get type() {
		return 'actor';
	}

	isIntersect(newActor) {
		if (!(newActor instanceof Actor)) {
			throw new Error(' Обязательный аргумент — только движущийся объект типа Actor');
		}

		if (newActor === this) {
			return false;
		}

		// Фигурные скобки у if лучше не опускать
		// Вам при проверке скажут, что это можно заменить на один if, но я считаю, что так лучше читается :)
		// так что если хотите - оставьте и ссылайтесь на меня
		if (this.top >= newActor.bottom) return false;
		if (this.bottom <= newActor.top) return false;
		if (this.right <= newActor.left) return false;
		if (this.left >= newActor.right) return false;

		return true;
	}
}

class Level {
	constructor(grid = [], actors = []) {
		// лучше создать копии массивов, чтобы нельзя было поменять поля объекта извне
		this.grid = grid;
		this.actors = actors;
		// тут лучше использовать стрелочную функцию
		this.player = this.actors.find(function(actor) {
			// всегда используйте === или !==
			return actor.type === "player";
		});
		this.status = null;
		this.finishDelay = 1;
		this.height = this.grid.length;
		// Math.max.apply(Math, args) можно заменить на Math.max(...args)
		// в map лучше передать стрелочную фукнцию (короче)
		// и чтобы не проверять длину 0 можно просто добавить в список аргуметов передаваемых в метод max
		this.width = this.height > 0 ? Math.max.apply(Math, this.grid.map(function(el) {
			return el.length;
		})) : 0;
	}

	isFinished() {
		// тут лучше написать просто return ...
		return this.status !== null && this.finishDelay < 0;
	}

	actorAt(newActor) {
		if (!(newActor instanceof Actor)) {
			throw new Error(' Обязательный аргумент — только движущийся объект типа Actor');
		}
		return this.actors.find(el => newActor.isIntersect(el));
	}

	obstacleAt(position, size) {
		if (!(position instanceof Vector && size instanceof Vector)) {
			throw new Error('Должен быть объект типа Vector');
		}

		// если значение переменной присываивается один раз, то нужно использовать const
		const xStart = Math.floor(position.x);
		const xEnd = Math.ceil(position.x + size.x);
		const yStart = Math.floor(position.y);
		const yEnd = Math.ceil(position.y + size.y);

		if (xStart < 0 || xEnd > this.width || yStart < 0) {
			return 'wall';
		}

		if(yEnd > this.height) {
			return 'lava';
		}

		// для объявления переменных нужно использовать let или const
	for (let y = yStart; y < yEnd; y++) {
		for (let x = xStart; x < xEnd; x++) {
				if (this.grid[y][x]) 
					return this.grid[y][x]; 
			}
		}
	}

	removeActor(newActor) {
		// var не используем
		for (let i = 0; i < this.actors.length; i++) {
			if(this.actors[i] === newActor) {
				this.actors.splice(i, 1); 
			}
		}
	}

	noMoreActors(typeOfActor) {
		// внешние скобки можно опустить
		return !this.actors.some(actor => actor.type === typeOfActor);
	}

	playerTouched(typeString, actorTouch) {
		// что тут имелось в виду? зачем этот if?
		if(this.status !== null) { 
			return;
		}

		if (typeString === 'lava' || typeString === 'fireball') {
			this.status = 'lost';
		}

		if(typeString === 'coin') {
			this.removeActor(actorTouch);
			if(this.noMoreActors('coin')) {
				this.status = 'won';
				// finishDelay не нужно трогать тут
			}
		}
	}

}

class LevelParser	{
	constructor(dictionary) {
		this.dictionary = dictionary; 
	}

	actorFromSymbol(symbol) {
		// все проверки лишние
		if (symbol === undefined) {
			return undefined;
		}
		if (symbol in this.dictionary) {
			return this.dictionary[symbol];
		}
		return undefined;
	}

	obstacleFromSymbol(symbol) {
		if(symbol === 'x') {
			return 'wall';
		} else if(symbol === '!') {
			return 'lava';
		} 
	}

	createGrid(plan) { 
		let arrays = [];
		// можно записать короче если исопльзовать map 2 раза
		if (plan.length === 0) {
			return arrays;
		} else {
			arrays = plan.map(string => string.split('')); 
		}
		for (let i = 0; i < arrays.length; i++) {
			arrays[i] = arrays[i].map(el => this.obstacleFromSymbol(el));
		}
		return arrays;
	}

	createActors(plan) {
		const actors = [];
		// целостность объекта лучше проверять в конструкторе
		if (this.dictionary) {
			plan.forEach((string, y) => {
				string.split('').forEach((symbol, x) => {
					// actorFromSymbol
					if (typeof(this.dictionary[symbol]) === 'function') {
						const actor = new this.dictionary[symbol](new Vector(x, y));
						if (actor instanceof Actor) {
							actors.push(actor);
						}
					}
				});
			});
		}
		return actors;
	}

	parse(plan) {
		return new Level(this.createGrid(plan), this.createActors(plan));
	}
}

class Fireball extends Actor {
	// не используйте констуруктор Vector без аргументов,
	// кто то может поменять его реализацию и по-умолчанию станет 1,1 а не 0,0
	constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
		super(pos, new Vector(1, 1), speed);
	}
	get type() {
		return 'fireball';
	}
	getNextPosition(time = 1) {
		// тут лучше использовать методы класса Vector
		return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
	}
	handleObstacle() {
		this.speed = this.speed.times(-1);
	}
	act(time, level) {
		let newPosition = this.getNextPosition(time);
		if (level.obstacleAt(newPosition, this.size)) {
			this.handleObstacle();
		} else {
			this.pos = newPosition;
		}
	}
}

class HorizontalFireball extends Fireball {
	constructor(pos) {
		super(pos, new Vector(2, 0));
	}
}

class VerticalFireball extends Fireball {
	constructor(pos) {
		super(pos, new Vector(0, 2));
	}
}

class FireRain extends Fireball {
		constructor(coords) {
			super(coords, new Vector(0, 3));
			// не нужно мутировать объекты Vector
			// speed должно задаваться через вызов конструктора базового класса
			this.startPos = coords;
		}

		handleObstacle() {
				this.pos = this.startPos;
		}
}

class Coin extends Actor {
	constructor(pos = new Vector(0, 0)) {
		super(pos, new Vector(0.6, 0.6));
		this.posCoin = this.pos = pos.plus(new Vector(0.2, 0.1));
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random() * 2 * Math.PI;
	}
	get type() {
		return 'coin';
	}
	updateSpring(time = 1) {
		this.spring += this.springSpeed * time;
	}

	getSpringVector() {
		return new Vector(0, Math.sin(this.spring) * this.springDist);
	}

	getNextPosition(time = 1) {
		this.updateSpring(time);
		return this.posCoin.plus(this.getSpringVector());
	}

	act(time) {
		this.pos = this.getNextPosition(time);
	}
}

class Player extends Actor {
	constructor(pos = new Vector(0, 0)) {
		super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
	}
	get type() {
		return 'player';
	}
}

const actorDict = {
	'@': Player,
	'o': Coin,
	'v': FireRain,
	'|': VerticalFireball,
	'=': HorizontalFireball
};

const parser = new LevelParser(actorDict);

loadLevels().then(levels => {
	return runGame(JSON.parse(levels), parser, DOMDisplay)
}).then(result => alert('Вы выиграли!'));