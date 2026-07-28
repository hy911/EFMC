/**
 * 11 个产品的导入数据（与 docs/PRODUCT_CONTENT_DRAFT.md 一致）。
 * 改文案改这里，然后重跑 scripts/import-products.mjs。
 *
 * category 填后台分类的**英文名**，脚本按它匹配已有分类。
 * cover 是素材包内该产品文件夹下的文件名，作为封面上传（产品的 images 字段必填）。
 */

export const CATEGORY_BY_NAME = {
  industrial: 'Industrial Automation Design',
  electrical: 'Electrical Automation Design',
  water: 'Water Treatment System Equipment & Automation Design',
  software: 'SCADA & HMI Software Design & Development / Programming',
}

export const products = [
  {
    folderIndex: 1,
    slug: 'siemens-s7-1200-plc-control-cabinet',
    category: CATEGORY_BY_NAME.industrial,
    featured: true,
    cover: '封面.jpg',
    en: {
      title: 'Siemens S7-1200 PLC Control Cabinet',
      excerpt:
        'Custom-built control cabinets around the Siemens S7-1200 platform, wired, programmed and factory-tested to your process specification.',
      body: [
        'The S7-1200 platform suits compact to mid-size automation tasks where a full S7-1500 rack would be oversized. We design the cabinet around your I/O list rather than a fixed catalogue layout: CPU and signal modules, protection and distribution, relay interfacing, terminal rows, and door-mounted operator controls are all laid out per project.',
        'Typical applications — packaging and processing lines · pump and fan control · small water treatment skids · OEM machine builds',
        'What we deliver — electrical drawings (CAD / EPLAN) · fabricated and wired cabinet · PLC and HMI programming · factory acceptance test · commissioning support, on-site or remote',
      ],
      metaTitle: 'Siemens S7-1200 PLC Control Cabinet | Custom Built | Donglin Controls',
      metaDescription:
        'Custom S7-1200 control cabinets designed to your I/O list — electrical drawings, fabrication, PLC/HMI programming and FAT. Request a quote.',
    },
    zh: {
      title: '西门子 S7-1200 系列 PLC 控制柜',
      excerpt: '以西门子 S7-1200 平台为核心的定制控制柜，按客户工艺要求完成接线、编程与出厂测试。',
      body: [
        'S7-1200 平台适用于中小规模自动化场景——用完整 S7-1500 机架显得过剩的项目。我们按客户的 I/O 清单设计柜体，而不是套用固定型录布局：CPU 与信号模块、保护与配电、继电器隔离、端子排、柜门操作元件，均按项目排布。',
        '典型应用 —— 包装与流程产线 · 泵与风机控制 · 小型水处理撬块 · OEM 整机配套',
        '我们交付什么 —— 电气图纸（CAD / EPLAN） · 柜体制作与接线 · PLC 与 HMI 编程 · 出厂验收测试（FAT） · 现场或远程调试支持',
      ],
      metaTitle: '西门子 S7-1200 PLC 控制柜｜定制设计制造｜东林众控',
      metaDescription:
        '按 I/O 清单定制的 S7-1200 控制柜，含电气图纸、柜体制作、PLC/HMI 编程与出厂测试。欢迎询价。',
    },
  },
  {
    folderIndex: 2,
    slug: 'siemens-s7-200-smart-plc-cabinet',
    category: CATEGORY_BY_NAME.industrial,
    featured: false,
    en: {
      title: 'Compact Siemens S7-200 SMART PLC Cabinet',
      excerpt:
        'Cost-efficient control cabinets on the S7-200 SMART platform for straightforward sequence and interlock control.',
      body: [
        'Where the control task is well-defined and does not need distributed I/O or high-speed motion, the S7-200 SMART keeps hardware cost down without giving up Siemens reliability or toolchain familiarity. Cabinets are built to the same wiring and testing standard as our larger systems.',
        'Typical applications — single-machine control · pump stations · HVAC and ventilation plant · retrofit of ageing relay logic',
        'What we deliver — electrical drawings · fabricated and wired cabinet · PLC programming · factory acceptance test · remote commissioning support',
      ],
      metaTitle: 'Siemens S7-200 SMART PLC Cabinet | Compact & Cost-Efficient',
      metaDescription:
        'Compact S7-200 SMART control cabinets for sequence and interlock control — drawings, fabrication, programming and testing.',
    },
    zh: {
      title: '西门子 S7-200 SMART 系列 PLC 控制柜',
      excerpt: '基于 S7-200 SMART 平台的高性价比控制柜，适用于顺序控制与联锁逻辑等常规场景。',
      body: [
        '当控制任务边界清晰、不需要分布式 I/O 或高速运动控制时，S7-200 SMART 能在保持西门子可靠性与工具链一致性的前提下降低硬件成本。柜体的接线与测试标准与大型系统一致。',
        '典型应用 —— 单机控制 · 泵站 · 暖通与通风设备 · 老旧继电器逻辑改造',
        '我们交付什么 —— 电气图纸 · 柜体制作与接线 · PLC 编程 · 出厂验收测试 · 远程调试支持',
      ],
      metaTitle: '西门子 S7-200 SMART PLC 控制柜｜紧凑型高性价比方案',
      metaDescription: '面向顺序控制与联锁逻辑的紧凑型 S7-200 SMART 控制柜，含图纸、制作、编程与测试。',
    },
  },
  {
    folderIndex: 3,
    slug: 'siemens-et200sp-s7-1500-plc-cabinet',
    category: CATEGORY_BY_NAME.industrial,
    featured: true,
    en: {
      title: 'Siemens ET200SP / S7-1500 PLC Cabinet',
      excerpt:
        'Modular I/O control systems on the S7-1500 and ET200SP platform for plant-scale automation with distributed stations.',
      body: [
        'For plants where I/O is spread across areas, ET200SP remote stations on PROFINET keep field wiring short while a central S7-1500 handles the process logic. This is the platform we recommend when the system is expected to grow, or when SCADA integration and long-term maintainability matter more than initial hardware cost.',
        'Typical applications — process plants · multi-line factories · water and wastewater works · energy and utility systems',
        'What we deliver — system architecture and network design · electrical drawings · main and remote station cabinets · PLC and WinCC/SCADA programming · factory acceptance test · commissioning',
      ],
      metaTitle: 'Siemens ET200SP / S7-1500 PLC Cabinet | Modular I/O Systems',
      metaDescription:
        'Plant-scale automation on S7-1500 with distributed ET200SP stations over PROFINET — architecture, cabinets, programming and commissioning.',
    },
    zh: {
      title: '西门子 ET200SP 及 S7-1500 系列 PLC 控制柜',
      excerpt: '基于 S7-1500 与 ET200SP 平台的模块化 I/O 控制系统，面向带分布式站点的整厂级自动化。',
      body: [
        '当 I/O 分散在多个区域时，通过 PROFINET 连接的 ET200SP 远程站可以大幅缩短现场布线，由中央 S7-1500 承担工艺逻辑。若系统后续需要扩展，或 SCADA 集成与长期可维护性比初期硬件成本更重要，我们通常推荐这个平台。',
        '典型应用 —— 流程工厂 · 多产线工厂 · 给排水与污水处理 · 能源与公用工程系统',
        '我们交付什么 —— 系统架构与网络设计 · 电气图纸 · 主站与远程站柜体 · PLC 与 WinCC/SCADA 编程 · 出厂验收测试 · 现场调试',
      ],
      metaTitle: '西门子 ET200SP / S7-1500 PLC 控制柜｜模块化 I/O 系统',
      metaDescription:
        '基于 S7-1500 与 PROFINET 分布式 ET200SP 站点的整厂自动化方案，含架构设计、柜体、编程与调试。',
    },
  },
  {
    folderIndex: 4,
    slug: 'hv-lv-switchgear-power-distribution-cabinet',
    category: CATEGORY_BY_NAME.electrical,
    featured: false,
    en: {
      title: 'HV/LV Switchgear & Power Distribution Cabinet',
      excerpt:
        'Power distribution and motor control cabinets built to project single-line diagrams, with documented component selection.',
      body: [
        "Distribution and power cabinets carry the plant, so component selection and workmanship matter more than appearance. We build to the project's single-line diagram, use documented brand components, and hand over the calculation and selection records with the cabinet.",
        'Typical applications — main and sub distribution boards · motor control centres · plant power supply for production lines',
        'What we deliver — single-line and layout drawings · busbar and enclosure fabrication · assembly and wiring · routine testing · complete documentation package',
      ],
      metaTitle: 'HV/LV Switchgear & Power Distribution Cabinet | Built to Spec',
      metaDescription:
        'Distribution boards and motor control centres built to your single-line diagram, with documented component selection and routine testing.',
    },
    zh: {
      title: '高低压开关柜与动力配电柜',
      excerpt: '按项目单线图制作的配电与电机控制柜，元器件选型全程留档。',
      body: [
        '配电与动力柜承载整个工厂的供电，元器件选型与制作工艺远比外观重要。我们按项目单线图制作，使用有据可查的品牌元器件，并随柜交付计算与选型记录。',
        '典型应用 —— 主配电柜与分配电柜 · 电机控制中心（MCC） · 生产线动力供电',
        '我们交付什么 —— 单线图与布置图 · 母排与柜体制作 · 装配接线 · 例行试验 · 完整技术文件',
      ],
      metaTitle: '高低压开关柜与动力配电柜｜按单线图定制',
      metaDescription: '按项目单线图制作的配电柜与电机控制中心，元器件选型留档，随柜交付完整技术文件。',
    },
  },
  {
    folderIndex: 5,
    slug: 'instrument-enclosure-operator-valve-control-box',
    category: CATEGORY_BY_NAME.electrical,
    featured: false,
    en: {
      title: 'Instrument Enclosure / Operator & Valve Control Box',
      excerpt:
        'Field enclosures for instruments, operator controls and solenoid valves, sized and drilled to your layout.',
      body: [
        'Small field boxes are where sloppy work shows up first — wrong ingress rating, drilled holes that leak, unlabelled terminals. These are built to the same standard as the main cabinets: correct gland selection, sealed penetrations, labelled terminals, and a wiring drawing that matches what is actually inside the box.',
        'Typical applications — field instrument junction · local operator stations · solenoid valve manifolds · sampling and dosing points',
        'What we deliver — enclosure selection and machining · internal assembly and wiring · labelling · as-built wiring drawing',
      ],
      metaTitle: 'Instrument Enclosure & Valve Control Box | Field Enclosures',
      metaDescription:
        'Field enclosures for instruments, operator stations and solenoid valves — correct ingress protection, labelled terminals, as-built drawings.',
    },
    zh: {
      title: '仪表箱 / 按钮箱 / 操作箱 / 电磁阀箱',
      excerpt: '面向仪表、操作元件与电磁阀的现场箱体，按客户布局定尺开孔。',
      body: [
        '小型现场箱最容易暴露工艺短板——防护等级选错、开孔渗水、端子无标识。我们按与主柜相同的标准制作：正确的电缆接头选型、密封开孔、端子标识齐全，并提供与箱内实物一致的接线图。',
        '典型应用 —— 现场仪表接线 · 就地操作站 · 电磁阀组 · 取样与加药点',
        '我们交付什么 —— 箱体选型与机加工 · 内部装配与接线 · 标识 · 竣工接线图',
      ],
      metaTitle: '仪表箱・操作箱・电磁阀箱｜现场箱体定制',
      metaDescription: '按客户布局定尺开孔的现场箱体，防护等级正确、端子标识齐全，附竣工接线图。',
    },
  },
  {
    folderIndex: 6,
    slug: 'multi-brand-plc-control-cabinet',
    category: CATEGORY_BY_NAME.industrial,
    featured: false,
    en: {
      title: 'Multi-brand PLC Control Cabinet',
      excerpt:
        'Control cabinets built on ABB, Schneider, Mitsubishi, Rockwell or Omron platforms when the plant standard is not Siemens.',
      body: [
        'Most plants have an existing PLC standard, and introducing a second brand creates a spare-parts and training burden that outlasts the project. We program and build on the platform you already run, so the new system fits your maintenance reality rather than ours.',
        'Typical applications — expansion of an existing non-Siemens plant · OEM builds tied to an end-customer standard · brand-specified tender projects',
        'What we deliver — platform-native programming · electrical drawings · cabinet fabrication and wiring · factory acceptance test · commissioning',
      ],
      metaTitle: 'Multi-brand PLC Control Cabinet | ABB, Schneider, Mitsubishi, Rockwell',
      metaDescription:
        'Control cabinets on your existing PLC standard — ABB, Schneider, Mitsubishi, Rockwell or Omron. Native programming, drawings, FAT.',
    },
    zh: {
      title: '多品牌 PLC 控制柜（ABB / 施耐德 / 三菱 / 罗克韦尔 / 欧姆龙）',
      excerpt: '当工厂标准不是西门子时，可基于 ABB、施耐德、三菱、罗克韦尔、欧姆龙平台制作控制柜。',
      body: [
        '多数工厂已有既定的 PLC 品牌标准，贸然引入第二个品牌会带来备件与培训负担，且影响远超项目本身。我们按客户既有平台编程与制柜，让新系统适配客户的运维现实，而不是我们的习惯。',
        '典型应用 —— 既有非西门子工厂扩建 · 受最终客户标准约束的 OEM 配套 · 招标文件指定品牌的项目',
        '我们交付什么 —— 原生平台编程 · 电气图纸 · 柜体制作与接线 · 出厂验收测试 · 现场调试',
      ],
      metaTitle: '多品牌 PLC 控制柜｜ABB・施耐德・三菱・罗克韦尔',
      metaDescription: '按客户既有 PLC 品牌标准制作控制柜，原生平台编程，含图纸、制作与出厂测试。',
    },
  },
  {
    folderIndex: 7,
    slug: 'abb-acs510-acs580-vfd-control-cabinet',
    category: CATEGORY_BY_NAME.electrical,
    featured: false,
    en: {
      title: 'ABB ACS510 / ACS580 VFD Control Cabinet',
      excerpt:
        'Variable frequency drive cabinets built around ABB ACS510/ACS580 drives, with PID and multi-pump control logic.',
      body: [
        'A drive in a cabinet is not just a drive on a mounting plate — heat, harmonics and EMC decide whether it survives its first summer. We size the enclosure for the actual thermal load, fit reactors and filtering where the installation calls for it, and program the control logic (PID, duty rotation, sleep/wake) rather than leaving it to default parameters.',
        'Typical applications — pump and fan energy saving · constant-pressure water supply · multi-pump duty rotation · conveyor and mixer drives',
        'What we deliver — drive sizing and thermal calculation · cabinet fabrication and wiring · drive parameterisation and control programming · factory acceptance test · commissioning',
      ],
      metaTitle: 'ABB ACS510 / ACS580 VFD Control Cabinet | PID & Multi-pump',
      metaDescription:
        'VFD cabinets around ABB ACS510/ACS580 drives — thermal sizing, reactors and filtering, PID and duty-rotation programming.',
    },
    zh: {
      title: 'ABB ACS510 / ACS580 变频器控制柜',
      excerpt: '基于 ABB ACS510/ACS580 变频器的变频控制柜，含 PID 调节与多泵轮换控制逻辑。',
      body: [
        '变频柜不是把变频器装在安装板上就完事——散热、谐波与 EMC 决定它能否熬过第一个夏天。我们按实际热负荷选定柜体，按现场需要配置电抗器与滤波，并实际编写控制逻辑（PID、多泵轮换、休眠唤醒），而不是沿用默认参数。',
        '典型应用 —— 泵与风机节能 · 恒压供水 · 多泵轮换 · 输送与搅拌设备驱动',
        '我们交付什么 —— 变频器选型与热计算 · 柜体制作与接线 · 变频参数整定与控制编程 · 出厂验收测试 · 现场调试',
      ],
      metaTitle: 'ABB ACS510 / ACS580 变频器控制柜｜PID 与多泵轮换',
      metaDescription: '基于 ABB ACS510/ACS580 的变频控制柜，含热计算、电抗与滤波配置、PID 与轮换逻辑编程。',
    },
  },
  {
    folderIndex: 8,
    slug: 'ro-edi-mbr-water-treatment-control-panel',
    category: CATEGORY_BY_NAME.water,
    featured: true,
    en: {
      title: 'RO / EDI / MBR Water Treatment Control Panel',
      excerpt:
        'Control panels for RO, EDI, A2O and MBR water treatment processes, with SCADA and remote monitoring.',
      body: [
        'Water treatment control is process control, not just motor starting: membrane flush cycles, conductivity and pH interlocks, dosing ratios and CIP sequences all have to be right or the plant damages its own consumables. We build the panel and write the process logic together, so the sequence matches the actual treatment train.',
        'Typical applications — RO and EDI pure water systems · municipal and industrial wastewater (A2O, MBR) · pump station automation · water quality monitoring and reporting',
        'What we deliver — process control logic · panel fabrication and wiring · PLC and SCADA programming · remote monitoring setup · commissioning and operator training',
      ],
      metaTitle: 'RO / EDI / MBR Water Treatment Control Panel | SCADA Ready',
      metaDescription:
        'Control panels for RO, EDI, A2O and MBR processes — process logic, PLC and SCADA programming, remote monitoring and operator training.',
    },
    zh: {
      title: '水处理系统控制柜（RO / EDI / A2O / MBR）',
      excerpt: '面向 RO、EDI、A2O、MBR 等水处理工艺的控制柜，配套 SCADA 与远程监控。',
      body: [
        '水处理控制属于工艺控制，不只是电机启停：膜冲洗周期、电导率与 pH 联锁、加药配比、CIP 清洗顺序，任何一项出错都会损耗系统自身的耗材。我们把柜体制作与工艺逻辑一起做，确保控制顺序与实际处理工艺段匹配。',
        '典型应用 —— RO 与 EDI 纯水系统 · 市政与工业污水（A2O、MBR） · 泵站自动化 · 水质监测与报表',
        '我们交付什么 —— 工艺控制逻辑 · 柜体制作与接线 · PLC 与 SCADA 编程 · 远程监控部署 · 现场调试与操作培训',
      ],
      metaTitle: '水处理控制柜（RO / EDI / A2O / MBR）｜含 SCADA 与远程监控',
      metaDescription:
        '面向 RO、EDI、A2O、MBR 工艺的控制柜，含工艺逻辑、PLC 与 SCADA 编程、远程监控与操作培训。',
    },
  },
  {
    folderIndex: 9,
    slug: 'wincc-hmi-scada-programming-service',
    category: CATEGORY_BY_NAME.software,
    featured: false,
    en: {
      title: 'WinCC HMI & SCADA Programming Service',
      excerpt:
        'HMI and SCADA screen design and programming on WinCC and TIA Portal, delivered with source files.',
      body: [
        "An operator screen is where your plant's usability is decided. We design the screen hierarchy around how operators actually work — overview, area, detail, alarm, trend — rather than reproducing the P&ID one-to-one. Alarms are prioritised so that a real fault is not buried under nuisance messages.",
        'Typical applications — new plant HMI/SCADA · replacement of obsolete visualisation · adding trending, alarms and reporting to an existing system · multi-language operator screens for export machinery',
        'What we deliver — screen hierarchy and navigation design · WinCC / TIA Portal project · alarm and trend configuration · reporting · source files and documentation · operator training',
      ],
      metaTitle: 'WinCC HMI & SCADA Programming Service | Source Files Included',
      metaDescription:
        'HMI and SCADA design and programming on WinCC / TIA Portal — screen hierarchy, alarms, trends, reporting, source files and training.',
    },
    zh: {
      title: '上位机及 HMI 软件设计编程服务',
      excerpt: '基于 WinCC 与 TIA Portal 的 HMI／上位机画面设计与编程，交付含源文件。',
      body: [
        '操作画面决定了工厂的实际易用性。我们按操作员的真实工作方式设计画面层级——总览、区域、详情、报警、趋势，而不是把 P&ID 一比一搬上屏幕。报警按优先级分级，避免真实故障被无关提示淹没。',
        '典型应用 —— 新建工厂 HMI/SCADA · 老旧监控系统替换 · 为既有系统增加趋势、报警与报表 · 出口设备的多语言操作画面',
        '我们交付什么 —— 画面层级与导航设计 · WinCC / TIA Portal 工程 · 报警与趋势组态 · 报表 · 源文件与文档 · 操作培训',
      ],
      metaTitle: '上位机及 HMI 软件编程服务｜WinCC / TIA Portal，交付源文件',
      metaDescription:
        '基于 WinCC / TIA Portal 的 HMI 与 SCADA 设计编程，含画面层级、报警趋势、报表、源文件与操作培训。',
    },
  },
  {
    folderIndex: 10,
    slug: 'plc-programming-commissioning-service',
    category: CATEGORY_BY_NAME.software,
    featured: false,
    en: {
      title: 'PLC Programming & Commissioning Service',
      excerpt:
        'PLC programming, simulation testing and commissioning for new systems or existing plant, remote or on-site.',
      body: [
        'We take the process description and turn it into structured, commented, maintainable code — then prove it in simulation before it touches your plant. Programs are handed over with source and documentation, so you are not locked to us for the next change.',
        'Typical applications — new machine or line programming · rewriting undocumented legacy programs · adding functions to a running plant · troubleshooting and optimisation',
        'What we deliver — control narrative review · structured PLC program with comments · offline simulation test · on-site or remote commissioning · source code and documentation handover',
      ],
      metaTitle: 'PLC Programming & Commissioning Service | Source Code Handover',
      metaDescription:
        'PLC programming, offline simulation testing and commissioning — structured commented code, source and documentation handed over.',
    },
    zh: {
      title: 'PLC 软件编程与调试服务',
      excerpt: '面向新建系统或既有工厂的 PLC 编程、模拟测试与调试，支持远程与现场两种方式。',
      body: [
        '我们把工艺说明转化为结构清晰、注释完整、可维护的程序，并在接触现场设备之前先用模拟验证。交付包含源码与文档——下一次修改，你不必被我们绑定。',
        '典型应用 —— 新设备或产线编程 · 无文档的老程序重写 · 为在运工厂增加功能 · 故障排查与优化',
        '我们交付什么 —— 控制方案评审 · 带注释的结构化 PLC 程序 · 离线模拟测试 · 现场或远程调试 · 源码与文档交付',
      ],
      metaTitle: 'PLC 软件编程与调试服务｜交付源码与文档',
      metaDescription: 'PLC 编程、离线模拟测试与现场／远程调试，交付带注释的结构化程序、源码与完整文档。',
    },
  },
  {
    folderIndex: 11,
    slug: 'iiot-plc-cloud-monitoring-system',
    category: CATEGORY_BY_NAME.software,
    featured: true,
    en: {
      title: 'IIoT PLC Cloud Monitoring System',
      excerpt:
        'Remote monitoring of PLC-controlled plant from phone or browser, with historical data and alarm push.',
      body: [
        'Equipment sold overseas is equipment you cannot walk up to. Cloud monitoring closes that gap: live status, historical trends and alarm push, so a fault is diagnosed before an engineer books a flight. Data collection runs on the PLC side over OPC UA/MQTT, so no change to the control logic is required.',
        'Typical applications — remote plant supervision across sites · after-sales support for exported machinery · unmanned pump and water stations · energy and production data collection',
        'What we deliver — gateway and data collection setup · cloud platform configuration · mobile and browser dashboards · alarm push rules · historical data and reporting',
      ],
      metaTitle: 'IIoT PLC Cloud Monitoring System | Remote Plant Supervision',
      metaDescription:
        'Monitor PLC-controlled plant from phone or browser — OPC UA/MQTT collection, dashboards, alarm push, historical data and reporting.',
    },
    zh: {
      title: 'PLC 远程监控与云数据系统（含手机 APP）',
      excerpt: '通过手机或浏览器远程监控 PLC 控制的设备，支持历史数据与报警推送。',
      body: [
        '卖到海外的设备，是你走不到跟前的设备。云监控补上这个缺口：实时状态、历史趋势、报警推送，让故障在工程师订机票之前就被定位。数据采集在 PLC 侧通过 OPC UA/MQTT 完成，不需要改动原有控制逻辑。',
        '典型应用 —— 跨厂区远程监管 · 出口设备售后支持 · 无人值守泵站与水站 · 能耗与产量数据采集',
        '我们交付什么 —— 网关与数据采集部署 · 云平台配置 · 手机与浏览器看板 · 报警推送规则 · 历史数据与报表',
      ],
      metaTitle: 'PLC 远程监控与云数据系统｜手机 APP 与浏览器看板',
      metaDescription:
        '通过 OPC UA/MQTT 采集 PLC 数据，手机与浏览器看板、报警推送、历史数据与报表，不改动原控制逻辑。',
    },
  },
]
