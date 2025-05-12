("use strict");

const fs = require("fs");
const PNG = require("pngjs").PNG;

/**
 * @configurable
 * Флаг что вы используете палитру, т.е. ваша цветовая палитра расширена
 */
const HAS_EXTENDED_COLORS = true;

/**
 * @configurable
 * Клавиши для закрытия/постановки скрипта на паузу/запуска
 */
const CLOSE_BUTTON = "O";
const PAUSE_BUTTON = "P";
const START_BUTTON = "K";

/**
 * @configurable
 * Время ожидания между операциями во время выбора цвета (по умолчанию 5) может быть так же
 * изменено при необходимости, но такой необходимости ещё никогда не возникало.
 */
const SLEEP_TIME = 5;

/**
 * @configurable
 * Стартовые координаты для выбора макросом цветов, как правило,
 * это координаты верхнего левого угла ячейки первого НЕ ПРОЗРАЧНОГО цвета в палитре
 * (такого же верхнего и левого). Эту координату можно получить используя
 * идущую вместе с AHK утилиту Window Spy.
 * По умолчанию настроено под монитор с разрешением 1920x1080.
 */
const xsccc = 815;
const ysccc = 665;

/**
 * @configurable
 * x и y координаты левого верхнего угла левой верхней точки на холсте.
 * Эту координату можно получить используя
 * идущую вместе с AHK утилиту Window Spy.
 * От неё, собственно, и идёт отсчёт.
 */
const xs = 877;
const ys = 384;

/**
 * @configurable
 * x и y координаты инструмента заливка (F)
 */
const FILLING_TOOL_X = 805;
const FILLING_TOOL_Y = 570;

/**
 * @configurable
 * x и y координаты инструмента кисточка (P)
 */
const BRUSH_TOOL_X = 805;
const BRUSH_TOOL_Y = 445;

/**
 * Конфигурация закончилась
 */

if (!process.argv[2]) {
  console.error("Ошибка: не указано название исходного файла!");
  process.exit(1);
}

const palette = [
  /* Стандартная */
  { r: 255, g: 255, b: 255 },
  { r: 0, g: 0, b: 0 },
  { r: 85, g: 85, b: 85 },
  { r: 0, g: 0, b: 170 },
  { r: 85, g: 85, b: 255 },
  { r: 0, g: 170, b: 0 },
  { r: 85, g: 255, b: 85 },
  { r: 0, g: 170, b: 170 },
  { r: 85, g: 255, b: 255 },
  { r: 170, g: 0, b: 0 },
  { r: 255, g: 85, b: 85 },
  { r: 170, g: 0, b: 170 },
  { r: 255, g: 85, b: 255 },
  { r: 170, g: 85, b: 0 },
  { r: 255, g: 255, b: 85 },
  { r: 170, g: 170, b: 170 },
];

/* Расширенная */
if (HAS_EXTENDED_COLORS) {
  palette.push(
    { r: 9, g: 160, b: 233 },
    { r: 1, g: 130, b: 198 },
    { r: 7, g: 82, b: 166 },
    { r: 0, g: 55, b: 176 },
    { r: 2, g: 25, b: 96 },
    { r: 1, g: 99, b: 58 },
    { r: 0, g: 128, b: 71 },
    { r: 1, g: 61, b: 44 },
    { r: 1, g: 55, b: 49 },
    { r: 149, g: 3, b: 24 },
    { r: 230, g: 11, b: 17 },
    { r: 199, g: 5, b: 39 },
    { r: 134, g: 16, b: 41 },
    { r: 149, g: 23, b: 70 },
    { r: 219, g: 59, b: 85 },
    { r: 213, g: 11, b: 121 },

    { r: 255, g: 24, b: 136 },
    { r: 248, g: 38, b: 161 },
    { r: 215, g: 142, b: 156 },
    { r: 221, g: 144, b: 138 },
    { r: 246, g: 174, b: 200 },
    { r: 241, g: 233, b: 131 },
    { r: 252, g: 234, b: 0 },
    { r: 255, g: 202, b: 0 },
    { r: 212, g: 173, b: 46 },
    { r: 180, g: 121, b: 0 },
    { r: 255, g: 83, b: 1 },
    { r: 224, g: 59, b: 3 },
    { r: 172, g: 45, b: 2 },
    { r: 224, g: 197, b: 143 },
    { r: 188, g: 191, b: 146 },
    { r: 186, g: 174, b: 143 }
  );
}

fs.createReadStream(process.argv[2])
  .on("error", (error) => {
    switch (error.code) {
      case "ENOENT":
        console.error("Ошибка: не удается найти исходный файл!");
        break;
      default:
        console.error(`Неизвестная ошибка! (${error.code}, ${error.errno})`);
    }
    process.exit(1);
  })
  .pipe(new PNG())
  .on("parsed", function () {
    function getClosestPaletteRGB(r, g, b) {
      let closestIdx = -1;
      let closestDiff = 195076;

      for (const i in palette) {
        const p = palette[i];
        const diff =
          Math.abs(p.r - r) * Math.abs(p.r - r) +
          Math.abs(p.g - g) * Math.abs(p.g - g) +
          Math.abs(p.b - b) * Math.abs(p.b - b);

        if (diff < closestDiff) {
          closestIdx = i;
          closestDiff = diff;
        }
      }

      return palette[closestIdx];
    }

    function createZeroedMDArray(dims) {
      let container = new Array(dims || 0);
      let i = dims;

      if (arguments.length > 1) {
        const args = Array.prototype.slice.call(arguments, 1);
        while (i--) {
          const dim = [dims - 1 - i];
          container[dim] = createZeroedMDArray.apply(this, args);
          container[dim].fill(0);
        }
      } else {
        container.fill(0);
      }

      return container;
    }

    if (this.width % 64 !== 0 || this.height % 64 !== 0) {
      console.error(
        "Ошибка: длина как минимум одной стороны изображения не кратна 64!"
      );

      process.exit(1);
    }

    let ditherData = createZeroedMDArray(2, this.width * 3);

    for (let y = 0; y < this.height; y++) {
      ditherData[0] = ditherData[1];
      ditherData[1] = createZeroedMDArray(this.width * 3);

      for (let x = 0; x < this.width; x++) {
        const idx = (this.width * y + x) << 2;

        let src = {
          r: this.data[idx] + ditherData[0][x * 3],
          g: this.data[idx + 1] + ditherData[0][x * 3 + 1],
          b: this.data[idx + 2] + ditherData[0][x * 3 + 2],
        };

        src.r = src.r > 255 ? 255 : src.r < 0 ? 0 : src.r;
        src.g = src.g > 255 ? 255 : src.g < 0 ? 0 : src.g;
        src.b = src.b > 255 ? 255 : src.b < 0 ? 0 : src.b;

        const trg = getClosestPaletteRGB(src.r, src.g, src.b);

        this.data[idx] = trg.r;
        this.data[idx + 1] = trg.g;
        this.data[idx + 2] = trg.b;

        const dlt = {
          r: src.r - trg.r,
          g: src.g - trg.g,
          b: src.b - trg.b,
        };

        const xps = [x + 1, x - 1, x, x + 1];
        const yps = [0, 1, 1, 1];
        const mps = [0.4375, 0.1875, 0.3125, 0.0625];

        for (let k = 0; k < 4; k++) {
          const xp = xps[k];
          const yp = yps[k];
          const mp = mps[k];

          if (xp < this.width && yp < this.height && xp > 0) {
            ditherData[yp][xp * 3] = ditherData[yp][xp * 3] + mp * dlt.r;
            ditherData[yp][xp * 3 + 1] =
              ditherData[yp][xp * 3 + 1] + mp * dlt.g;
            ditherData[yp][xp * 3 + 2] =
              ditherData[yp][xp * 3 + 2] + mp * dlt.b;
          }
        }
      }
    }

    if (!fs.existsSync("result")) {
      fs.mkdirSync("result");
    } else if (fs.readdirSync("result").length !== 0) {
      for (let file of fs.readdirSync("result"))
        fs.unlinkSync("result/" + file);
    }

    this.pack().pipe(fs.createWriteStream("result/image.png"));

    for (let x = 0; x < this.width; x += 64) {
      for (let y = 0; y < this.height; y += 64) {
        const part = new PNG({
          width: 64,
          height: 64,
        });

        this.bitblt(part, x, y, 64, 64);

        /**
         * @configurable
         * Значение опции MouseClickDelay (по умолчанию -1) может быть увеличено при необходимости.
         * Увеличивать его следует лишь в том случае, если при перемещении курсора периодически
         * остаётся след.
         */
        let macro = `SetMouseDelay, -1\nSetBatchLines, -1\nProcess, Priority,, High\n${PAUSE_BUTTON}::Pause\n${CLOSE_BUTTON}::ExitApp\n${START_BUTTON}::\n`;

        let macroparts = [];

        for (let i = 0; i < part.width; i++) {
          for (let j = 0; j < part.height; j++) {
            const color = recognizeColorX(
              part.data.readUInt32BE((64 * i + j) << 2)
            );
            if (
              macroparts[
                parseInt(color[0].toString() + color[1].toString())
              ] === undefined
            ) {
              /** @configurable
               *   Время ожидания между операциями во время выбора цвета (по умолчанию 5) может быть так же
               * изменено при необходимости, но такой необходимости ещё никогда не возникало.
               *   Также в последней строке используются две достаточно строгие константы: x и y координаты
               * левого верхнего угла левой верхней точки на холсте. От неё, собственно, и идёт отсчёт.
               */
              macroparts[parseInt(color[0].toString() + color[1].toString())] =
                `Sleep ${SLEEP_TIME}\n` +
                `MouseClick, left, ${color[0]}, ${color[1]}, 1, D\nMouseClick, left, ${color[0]}, ${color[1]}, 1, U\n` +
                `Sleep ${SLEEP_TIME}\n` +
                `MouseClick, left, ${xs + j * 4}, ${
                  ys + i * 4
                }, 1, D\nMouseClick, left, ${xs + j * 4}, ${
                  ys + i * 4
                }, 1, U\n`;
            } else {
              macroparts[
                parseInt(color[0].toString() + color[1].toString())
              ] += `MouseClick, left, ${xs + j * 4}, ${
                ys + i * 4
              }, 1, D\nMouseClick, left, ${xs + j * 4}, ${
                ys + i * 4
              }, 1, U\nSleep ${SLEEP_TIME}\n`;
            }
          }
        }

        let longestIndex = -1;
        let longestLength = 0;
        for (let i in macroparts) {
          const length = macroparts[i].match(/MouseClick/g).length;

          if (length > longestLength) {
            longestIndex = i;
            longestLength = length;
          }
        }

        /** @configurable
         *   Для оптимизации рисования самый используемый цвет считается основным
         * и первое действие, которое производит макрос - заливает холст им, поэтому необходимы
         * три координаты (сверху вниз): координата кнопки инструмента заливки, координата любой
         * точки внутри холста и координата инструмента кисти (или карандаша, не помню что там).
         */
        macro +=
          macroparts[longestIndex].split("\n", 2)[1] +
          `\nMouseClick, left, ${FILLING_TOOL_X}, ${FILLING_TOOL_Y}, 1, U\n` +
          `\nMouseClick, left, ${FILLING_TOOL_X}, ${FILLING_TOOL_Y}, 1, D\nMouseClick, left, ${FILLING_TOOL_X}, ${FILLING_TOOL_Y}, 1, U` +
          `\nMouseClick, left, ${xs}, ${ys}, 1, D\nMouseClick, left, ${xs}, ${ys}, 1, U` +
          `\nMouseClick, left, ${BRUSH_TOOL_X}, ${BRUSH_TOOL_Y}, 1, D\nMouseClick, left, ${BRUSH_TOOL_X}, ${BRUSH_TOOL_Y}, 1, U\n`;
        macroparts.splice(longestIndex, 1);

        for (let i in macroparts) macro += macroparts[i];

        fs.writeFileSync(
          `result/part_${(x + 64) / 64}_${(y + 64) / 64}.ahk`,
          macro
        );
      }
    }
  });

function recognizeExtendedColorX(color) {
  let coords = [];

  switch (color) {
    case 161540607:
      coords[0] = xsccc;
      coords[1] = ysccc + 20;
      break;
    case 25347839:
      coords[0] = xsccc + 20;
      coords[1] = ysccc + 20;
      break;
    case 122857215:
      coords[0] = xsccc + 40;
      coords[1] = ysccc + 20;
      break;
    case 3649791:
      coords[0] = xsccc + 60;
      coords[1] = ysccc + 20;
      break;
    case 35217663:
      coords[0] = xsccc + 80;
      coords[1] = ysccc + 20;
      break;
    case 23280383:
      coords[0] = xsccc + 100;
      coords[1] = ysccc + 20;
      break;
    case 8407039:
      coords[0] = xsccc + 120;
      coords[1] = ysccc + 20;
      break;
    case 20786431:
      coords[0] = xsccc + 140;
      coords[1] = ysccc + 20;
      break;
    case 20394495:
      coords[0] = xsccc + 160;
      coords[1] = ysccc + 20;
      break;
    case 2500008191:
      coords[0] = xsccc + 180;
      coords[1] = ysccc + 20;
      break;
    case 3859485183:
      coords[0] = xsccc + 200;
      coords[1] = ysccc + 20;
      break;
    case 3339003903:
      coords[0] = xsccc + 220;
      coords[1] = ysccc + 20;
      break;
    case 2249206271:
      coords[0] = xsccc + 240;
      coords[1] = ysccc + 20;
      break;
    case 2501330687:
      coords[0] = xsccc + 260;
      coords[1] = ysccc + 20;
      break;
    case 3678098943:
      coords[0] = xsccc + 280;
      coords[1] = ysccc + 20;
      break;
    case 3574299135:
      coords[0] = xsccc + 300;
      coords[1] = ysccc + 20;
      break;

    case 4279798015:
      coords[0] = xsccc;
      coords[1] = ysccc + 40;
      break;
    case 4163281407:
      coords[0] = xsccc + 20;
      coords[1] = ysccc + 40;
      break;
    case 3616447743:
      coords[0] = xsccc + 40;
      coords[1] = ysccc + 40;
      break;
    case 3717237503:
      coords[0] = xsccc + 60;
      coords[1] = ysccc + 40;
      break;
    case 4138649855:
      coords[0] = xsccc + 80;
      coords[1] = ysccc + 40;
      break;
    case 4058612735:
      coords[0] = xsccc + 100;
      coords[1] = ysccc + 40;
      break;
    case 4243194111:
      coords[0] = xsccc + 120;
      coords[1] = ysccc + 40;
      break;
    case 4291428607:
      coords[0] = xsccc + 140;
      coords[1] = ysccc + 40;
      break;
    case 3568119551:
      coords[0] = xsccc + 160;
      coords[1] = ysccc + 40;
      break;
    case 3027828991:
      coords[0] = xsccc + 180;
      coords[1] = ysccc + 40;
      break;
    case 4283630079:
      coords[0] = xsccc + 200;
      coords[1] = ysccc + 40;
      break;
    case 3761964031:
      coords[0] = xsccc + 220;
      coords[1] = ysccc + 40;
      break;
    case 2888631039:
      coords[0] = xsccc + 240;
      coords[1] = ysccc + 40;
      break;
    case 3771043839:
      coords[0] = xsccc + 260;
      coords[1] = ysccc + 40;
      break;
    case 3166671615:
      coords[0] = xsccc + 280;
      coords[1] = ysccc + 40;
      break;
    case 3132002303:
      coords[0] = xsccc + 300;
      coords[1] = ysccc + 40;
      break;
  }

  return coords;
}

function recognizeColorX(color) {
  let coords = [];

  switch (color) {
    case 0:
      coords[0] = xsccc - 20;
      coords[1] = ysccc;
      break;
    case 4294967295:
      coords[0] = xsccc;
      coords[1] = ysccc;
      break;
    case 255:
      coords[0] = xsccc + 20;
      coords[1] = ysccc;
      break;
    case 1431655935:
      coords[0] = xsccc + 40;
      coords[1] = ysccc;
      break;
    case 43775:
      coords[0] = xsccc + 60;
      coords[1] = ysccc;
      break;
    case 1431699455:
      coords[0] = xsccc + 80;
      coords[1] = ysccc;
      break;
    case 11141375:
      coords[0] = xsccc + 100;
      coords[1] = ysccc;
      break;
    case 1442797055:
      coords[0] = xsccc + 120;
      coords[1] = ysccc;
      break;
    case 11184895:
      coords[0] = xsccc + 140;
      coords[1] = ysccc;
      break;
    case 1442840575:
      coords[0] = xsccc + 160;
      coords[1] = ysccc;
      break;
    case 2852126975:
      coords[0] = xsccc + 180;
      coords[1] = ysccc;
      break;
    case 4283782655:
      coords[0] = xsccc + 200;
      coords[1] = ysccc;
      break;
    case 2852170495:
      coords[0] = xsccc + 220;
      coords[1] = ysccc;
      break;
    case 4283826175:
      coords[0] = xsccc + 240;
      coords[1] = ysccc;
      break;
    case 2857697535:
      coords[0] = xsccc + 260;
      coords[1] = ysccc;
      break;
    case 4294923775:
      coords[0] = xsccc + 280;
      coords[1] = ysccc;
      break;
    case 2863311615:
      coords[0] = xsccc + 300;
      coords[1] = ysccc;
      break;
  }

  if (HAS_EXTENDED_COLORS && coords.length < 2) {
    coords = recognizeExtendedColorX(color);
  }

  if (coords.length < 2) {
    console.log(
      `Ошибка: обнаружен выходящий за пределы палитры цвет! color = ${color}`
    );
    process.exit(1);
  }

  return coords;
}
