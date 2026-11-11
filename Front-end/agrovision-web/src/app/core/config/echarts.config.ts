import * as echarts from 'echarts/core';

import {
  BarChart,
  LineChart,
  PieChart
} from 'echarts/charts';

import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from 'echarts/components';

import {
  CanvasRenderer
} from 'echarts/renderers';


echarts.use([

  // Gráficos
  BarChart,
  LineChart,
  PieChart,

  // Componentes
  GridComponent,
  LegendComponent,
  TooltipComponent,

  // Renderização
  CanvasRenderer

]);


export {
  echarts
};