import readline from "readline";
import _ from "lodash";

function repeat(c, n) {
  return [...new Array(n)].map(() => _.cloneDeep(c));
}

function getRandomPoint(all, exclude) {
  const optionalPoints = all.filter(
    (p) => !exclude.filter((n) => n.x === p.y && n.y === p.y).length
  );
  return optionalPoints[Math.floor(Math.random() * optionalPoints.length)];
}

class Screen {
  objs = [];

  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.points = [];
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        this.points.push({
          x: i,
          y: j,
        });
      }
    }
  }

  trigger(eventName, payload = {}) {
    this.objs.forEach((obj) => {
      const listeners = obj.events && obj.events[eventName];
      if (!_.isArray(listeners)) {
        return;
      }
      const event = {
        name: eventName,
        payload,
        target: obj,
      };
      listeners.forEach((callback) => {
        callback(event);
      });
    });
  }

  append(obj) {
    if (!this.objs.includes(obj)) {
      obj.container = this;
      this.objs.push(obj);
    }
  }

  renderFrame() {
    const row = repeat("·", this.width);
    const table = repeat(row, this.height);
    this.objs.forEach((obj) => {
      if (obj.render) {
        obj.render(table);
      }
    });
    console.clear();
    console.log(table.map((row) => row.join("")).join(""));
  }

  render() {
    setInterval(() => {
      this.renderFrame();
    }, 80);
  }
}

class Snake {
  container = null;
  events = {};
  direction = "SNAKE_RIGHT";
  dropTail = null;

  constructor(nodes) {
    this.nodes = nodes;
  }

  render(table) {
    this.nodes.forEach(({ x, y }) => {
      table[y][x] = "X";
    });
  }

  changeDirection(direction) {
    const UP_OR_DOWN = ["SNAKE_UP", "SNAKE_DOWN"];
    if (UP_OR_DOWN.includes(direction) && UP_OR_DOWN.includes(this.direction)) {
      return;
    }
    if (
      !UP_OR_DOWN.includes(direction) &&
      !UP_OR_DOWN.includes(this.direction)
    ) {
      return;
    }
    this.direction = direction;
  }

  registerListener(eventName, callback) {
    let listeners = this.events[eventName];
    if (!_.isArray(listeners)) {
      listeners = this.events[eventName] = [];
    }
    listeners.push(callback);
    return () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  getNextHead() {
    const { nodes, direction, container } = this;
    const head = nodes[0];
    switch (direction) {
      case "SNAKE_UP": {
        return {
          x: head.x,
          y: head.y - 1 < 0 ? container.height - 1 : head.y - 1,
        };
      }
      case "SNAKE_DOWN": {
        return {
          x: head.x,
          y: head.y + 1 > container.height - 1 ? 0 : head.y + 1,
        };
      }
      case "SNAKE_LEFT": {
        return {
          x: head.x - 1 < 0 ? container.width - 1 : head.x - 1,
          y: head.y,
        };
      }
      case "SNAKE_RIGHT": {
        return {
          x: head.x + 1 > container.width - 1 ? 0 : head.x + 1,
          y: head.y,
        };
      }
    }
  }

  nextStep() {
    const { nodes } = this;
    this.dropTail = nodes.pop();
    nodes.unshift(this.getNextHead());
  }

  move(afterCallback) {
    setInterval(() => {
      this.nextStep();
      afterCallback();
    }, 200);
  }
}

class Apple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  render(table) {
    const { x, y } = this;
    table[y][x] = "#";
  }
}

export function start() {
  const width = process.stdout.columns;
  const height = process.stdout.rows - 1;
  const screen = new Screen(width, height);
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on("keypress", (str, key) => {
    if (key.ctrl && key.name === "c") {
      process.exit();
    }
    const action = key.name.toUpperCase();
    switch (action) {
      case "W":
      case "K":
      case "UP":
        screen.trigger("SNAKE_UP");
        break;
      case "A":
      case "H":
      case "LEFT":
        screen.trigger("SNAKE_LEFT");
        break;
      case "S":
      case "J":
      case "DOWN":
        screen.trigger("SNAKE_DOWN");
        break;
      case "D":
      case "L":
      case "RIGHT":
        screen.trigger("SNAKE_RIGHT");
        break;
    }
  });
  const screenCenter = {
    x: Math.round(screen.width / 2),
    y: Math.round(screen.height / 2),
  };
  const snake = new Snake([
    screenCenter,
    {
      x: screenCenter - 1,
      y: screenCenter.y,
    },
    {
      x: screenCenter - 2,
      y: screenCenter.y,
    },
    {
      x: screenCenter - 3,
      y: screenCenter.y,
    },
    {
      x: screenCenter - 4,
      y: screenCenter.y,
    },
    {
      x: screenCenter - 5,
      y: screenCenter.y,
    },
  ]);
  snake.registerListener("SNAKE_UP", (event) => {
    snake.changeDirection(event.name);
  });
  snake.registerListener("SNAKE_LEFT", (event) => {
    snake.changeDirection(event.name);
  });
  snake.registerListener("SNAKE_DOWN", (event) => {
    snake.changeDirection(event.name);
  });
  snake.registerListener("SNAKE_RIGHT", (event) => {
    snake.changeDirection(event.name);
  });
  let randomPoint = getRandomPoint(screen.points, snake.nodes);
  const apple = new Apple(randomPoint.x, randomPoint.y);
  snake.move(() => {
    const head = snake.nodes[0];

    if (head.x === apple.x && head.y === apple.y) {
      const nextHead = snake.getNextHead();
      randomPoint = getRandomPoint(screen.points, [nextHead, ...snake.nodes]);
      apple.x = randomPoint.x;
      apple.y = randomPoint.y;
      // snake.nodes.unshift(nextHead);
      snake.nodes.push(snake.dropTail);
    }

    if (
      snake.nodes.slice(4).filter((n) => n.x === head.x && n.y === head.y)
        .length
    ) {
      throw new Error();
    }
  });
  screen.append(apple);
  screen.append(snake);
  screen.render();
}

export default {
  start,
};
