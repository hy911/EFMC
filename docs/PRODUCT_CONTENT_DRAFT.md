# 产品内容草稿（11 个产品）

配合[规格问卷](PRODUCT_SPECS_QUESTIONNAIRE.md)使用：问卷收集规格参数，本文件提供名称、摘要、详细介绍、SEO 的中英草稿。

**规格参数留空即可发布**，不阻塞上线。

---

## 一、图片处理（先看这个，影响所有产品）

素材包里的实拍图质量不错——是真实车间和柜内照，不是网图，这在 B2B 站上比精修图更有说服力。但有三件事要先处理：

### 1. 图是躺着的，必须转正

多数柜体照拍摄时相机横置，柜子在画面里是侧躺的。直接上传，产品页上会是一排横倒的柜子。上传前批量旋转 90°。

### 2. 不要上传 `彩页.png`

每个产品文件夹里都有同一张 12 步「Transaction flow」流程图。不适合放网站：

- 文字烧进像素——中文站显示英文、手机上读不了、SEO 抓不到（和当初不贴海报整图是同一个问题）
- 里面混了图库网图（视频通话、刷卡机、卡车三张），素材包自己的 `必看.txt` 第 4 条禁止使用网络图片

它的**内容**要用，见下方第三节，转成结构化文字。

### 3. 选图顺序

每个产品选 4–6 张，第一张是封面（列表页卡片显示的就是它）。建议顺序：

1. **柜体正面整体图**（关门状态，能看出产品形态）—— 做封面
2. **柜内布线图**（开门状态，展示工艺水平）—— 这是最能建立专业度的一张
3. **细节图**（端子排、PLC 模块、铭牌）
4. **应用/现场图**（装在客户现场的）
5. **包装/发货图**（木箱、打包）

产品 1 的 `封面.jpg` 就是很好的第 2 类图（S7-1200 CPU、继电器组、端子排、断路器、24V 电源一目了然），但它是躺着的，转正后用。

---

## 二、11 个产品的文案草稿

> 摘要（Excerpt）是必填项，显示在产品卡片上，1–2 句。
> 详细介绍（Description）是富文本，建议结构：一段定位说明 + 「典型应用」列表 + 「我们交付什么」列表。
> 下面的英文是主文案，中文是对照译文。**技术名词（PLC 型号、协议名、标准号）中英文都保持原样不译。**

---

### 产品 1 · Siemens S7-1200 PLC Control Cabinet

**分类**：工业自动化设计　|　**建议首页精选**：是

| 字段 | 内容 |
|---|---|
| 标题 EN | `Siemens S7-1200 PLC Control Cabinet` |
| 标题 ZH | `西门子 S7-1200 系列 PLC 控制柜` |
| Slug | `siemens-s7-1200-plc-control-cabinet` |

**摘要 EN**
> Custom-built control cabinets around the Siemens S7-1200 platform, wired, programmed and factory-tested to your process specification.

**摘要 ZH**
> 以西门子 S7-1200 平台为核心的定制控制柜，按客户工艺要求完成接线、编程与出厂测试。

**详细介绍 EN**
> The S7-1200 platform suits compact to mid-size automation tasks where a full S7-1500 rack would be oversized. We design the cabinet around your I/O list rather than a fixed catalogue layout: CPU and signal modules, protection and distribution, relay interfacing, terminal rows, and door-mounted operator controls are all laid out per project.
>
> **Typical applications** — packaging and processing lines · pump and fan control · small water treatment skids · OEM machine builds
>
> **What we deliver** — electrical drawings (CAD / EPLAN) · fabricated and wired cabinet · PLC and HMI programming · factory acceptance test · commissioning support, on-site or remote

**详细介绍 ZH**
> S7-1200 平台适用于中小规模自动化场景——用完整 S7-1500 机架显得过剩的项目。我们按客户的 I/O 清单设计柜体，而不是套用固定型录布局：CPU 与信号模块、保护与配电、继电器隔离、端子排、柜门操作元件，均按项目排布。
>
> **典型应用** —— 包装与流程产线 · 泵与风机控制 · 小型水处理撬块 · OEM 整机配套
>
> **我们交付什么** —— 电气图纸（CAD / EPLAN） · 柜体制作与接线 · PLC 与 HMI 编程 · 出厂验收测试（FAT） · 现场或远程调试支持

**SEO**
- Meta Title EN：`Siemens S7-1200 PLC Control Cabinet | Custom Built | Donglin Controls`
- Meta Title ZH：`西门子 S7-1200 PLC 控制柜｜定制设计制造｜东林众控`
- Meta Description EN：`Custom S7-1200 control cabinets designed to your I/O list — electrical drawings, fabrication, PLC/HMI programming and FAT. Request a quote.`
- Meta Description ZH：`按 I/O 清单定制的 S7-1200 控制柜，含电气图纸、柜体制作、PLC/HMI 编程与出厂测试。欢迎询价。`

---

### 产品 2 · Compact Siemens S7-200 SMART PLC Cabinet

**分类**：工业自动化设计

| 字段 | 内容 |
|---|---|
| 标题 EN | `Compact Siemens S7-200 SMART PLC Cabinet` |
| 标题 ZH | `西门子 S7-200 SMART 系列 PLC 控制柜` |
| Slug | `siemens-s7-200-smart-plc-cabinet` |

**摘要 EN**
> Cost-efficient control cabinets on the S7-200 SMART platform for straightforward sequence and interlock control.

**摘要 ZH**
> 基于 S7-200 SMART 平台的高性价比控制柜，适用于顺序控制与联锁逻辑等常规场景。

**详细介绍 EN**
> Where the control task is well-defined and does not need distributed I/O or high-speed motion, the S7-200 SMART keeps hardware cost down without giving up Siemens reliability or toolchain familiarity. Cabinets are built to the same wiring and testing standard as our larger systems.
>
> **Typical applications** — single-machine control · pump stations · HVAC and ventilation plant · retrofit of ageing relay logic
>
> **What we deliver** — electrical drawings · fabricated and wired cabinet · PLC programming · factory acceptance test · remote commissioning support

**详细介绍 ZH**
> 当控制任务边界清晰、不需要分布式 I/O 或高速运动控制时，S7-200 SMART 能在保持西门子可靠性与工具链一致性的前提下降低硬件成本。柜体的接线与测试标准与大型系统一致。
>
> **典型应用** —— 单机控制 · 泵站 · 暖通与通风设备 · 老旧继电器逻辑改造
>
> **我们交付什么** —— 电气图纸 · 柜体制作与接线 · PLC 编程 · 出厂验收测试 · 远程调试支持

**SEO**
- Meta Title EN：`Siemens S7-200 SMART PLC Cabinet | Compact & Cost-Efficient`
- Meta Title ZH：`西门子 S7-200 SMART PLC 控制柜｜紧凑型高性价比方案`

---

### 产品 3 · Siemens ET200SP / S7-1500 PLC Cabinet

**分类**：工业自动化设计　|　**建议首页精选**：是

| 字段 | 内容 |
|---|---|
| 标题 EN | `Siemens ET200SP / S7-1500 PLC Cabinet` |
| 标题 ZH | `西门子 ET200SP 及 S7-1500 系列 PLC 控制柜` |
| Slug | `siemens-et200sp-s7-1500-plc-cabinet` |

**摘要 EN**
> Modular I/O control systems on the S7-1500 and ET200SP platform for plant-scale automation with distributed stations.

**摘要 ZH**
> 基于 S7-1500 与 ET200SP 平台的模块化 I/O 控制系统，面向带分布式站点的整厂级自动化。

**详细介绍 EN**
> For plants where I/O is spread across areas, ET200SP remote stations on PROFINET keep field wiring short while a central S7-1500 handles the process logic. This is the platform we recommend when the system is expected to grow, or when SCADA integration and long-term maintainability matter more than initial hardware cost.
>
> **Typical applications** — process plants · multi-line factories · water and wastewater works · energy and utility systems
>
> **What we deliver** — system architecture and network design · electrical drawings · main and remote station cabinets · PLC and WinCC/SCADA programming · factory acceptance test · commissioning

**详细介绍 ZH**
> 当 I/O 分散在多个区域时，通过 PROFINET 连接的 ET200SP 远程站可以大幅缩短现场布线，由中央 S7-1500 承担工艺逻辑。若系统后续需要扩展，或 SCADA 集成与长期可维护性比初期硬件成本更重要，我们通常推荐这个平台。
>
> **典型应用** —— 流程工厂 · 多产线工厂 · 给排水与污水处理 · 能源与公用工程系统
>
> **我们交付什么** —— 系统架构与网络设计 · 电气图纸 · 主站与远程站柜体 · PLC 与 WinCC/SCADA 编程 · 出厂验收测试 · 现场调试

---

### 产品 4 · HV/LV Switchgear & Power Distribution Cabinet

**分类**：电气自动化设计

| 字段 | 内容 |
|---|---|
| 标题 EN | `HV/LV Switchgear & Power Distribution Cabinet` |
| 标题 ZH | `高低压开关柜与动力配电柜` |
| Slug | `hv-lv-switchgear-power-distribution-cabinet` |

**摘要 EN**
> Power distribution and motor control cabinets built to project single-line diagrams, with documented component selection.

**摘要 ZH**
> 按项目单线图制作的配电与电机控制柜，元器件选型全程留档。

**详细介绍 EN**
> Distribution and power cabinets carry the plant, so component selection and workmanship matter more than appearance. We build to the project's single-line diagram, use documented brand components, and hand over the calculation and selection records with the cabinet.
>
> **Typical applications** — main and sub distribution boards · motor control centres · plant power supply for production lines
>
> **What we deliver** — single-line and layout drawings · busbar and enclosure fabrication · assembly and wiring · routine testing · complete documentation package

**详细介绍 ZH**
> 配电与动力柜承载整个工厂的供电，元器件选型与制作工艺远比外观重要。我们按项目单线图制作，使用有据可查的品牌元器件，并随柜交付计算与选型记录。
>
> **典型应用** —— 主配电柜与分配电柜 · 电机控制中心（MCC） · 生产线动力供电
>
> **我们交付什么** —— 单线图与布置图 · 母排与柜体制作 · 装配接线 · 例行试验 · 完整技术文件

---

### 产品 5 · Instrument Enclosure / Operator & Valve Control Box

**分类**：电气自动化设计

| 字段 | 内容 |
|---|---|
| 标题 EN | `Instrument Enclosure / Operator & Valve Control Box` |
| 标题 ZH | `仪表箱 / 按钮箱 / 操作箱 / 电磁阀箱` |
| Slug | `instrument-enclosure-operator-valve-control-box` |

**摘要 EN**
> Field enclosures for instruments, operator controls and solenoid valves, sized and drilled to your layout.

**摘要 ZH**
> 面向仪表、操作元件与电磁阀的现场箱体，按客户布局定尺开孔。

**详细介绍 EN**
> Small field boxes are where sloppy work shows up first — wrong ingress rating, drilled holes that leak, unlabelled terminals. These are built to the same standard as the main cabinets: correct gland selection, sealed penetrations, labelled terminals, and a wiring drawing that matches what is actually inside the box.
>
> **Typical applications** — field instrument junction · local operator stations · solenoid valve manifolds · sampling and dosing points
>
> **What we deliver** — enclosure selection and machining · internal assembly and wiring · labelling · as-built wiring drawing

**详细介绍 ZH**
> 小型现场箱最容易暴露工艺短板——防护等级选错、开孔渗水、端子无标识。我们按与主柜相同的标准制作：正确的电缆接头选型、密封开孔、端子标识齐全，并提供与箱内实物一致的接线图。
>
> **典型应用** —— 现场仪表接线 · 就地操作站 · 电磁阀组 · 取样与加药点
>
> **我们交付什么** —— 箱体选型与机加工 · 内部装配与接线 · 标识 · 竣工接线图

---

### 产品 6 · Multi-brand PLC Control Cabinet (ABB / Schneider / Mitsubishi / Rockwell)

**分类**：工业自动化设计

| 字段 | 内容 |
|---|---|
| 标题 EN | `Multi-brand PLC Control Cabinet` |
| 标题 ZH | `多品牌 PLC 控制柜（ABB / 施耐德 / 三菱 / 罗克韦尔 / 欧姆龙）` |
| Slug | `multi-brand-plc-control-cabinet` |

**摘要 EN**
> Control cabinets built on ABB, Schneider, Mitsubishi, Rockwell or Omron platforms when the plant standard is not Siemens.

**摘要 ZH**
> 当工厂标准不是西门子时，可基于 ABB、施耐德、三菱、罗克韦尔、欧姆龙平台制作控制柜。

**详细介绍 EN**
> Most plants have an existing PLC standard, and introducing a second brand creates a spare-parts and training burden that outlasts the project. We program and build on the platform you already run, so the new system fits your maintenance reality rather than ours.
>
> **Typical applications** — expansion of an existing non-Siemens plant · OEM builds tied to an end-customer standard · brand-specified tender projects
>
> **What we deliver** — platform-native programming · electrical drawings · cabinet fabrication and wiring · factory acceptance test · commissioning

**详细介绍 ZH**
> 多数工厂已有既定的 PLC 品牌标准，贸然引入第二个品牌会带来备件与培训负担，且影响远超项目本身。我们按客户既有平台编程与制柜，让新系统适配客户的运维现实，而不是我们的习惯。
>
> **典型应用** —— 既有非西门子工厂扩建 · 受最终客户标准约束的 OEM 配套 · 招标文件指定品牌的项目
>
> **我们交付什么** —— 原生平台编程 · 电气图纸 · 柜体制作与接线 · 出厂验收测试 · 现场调试

---

### 产品 7 · ABB ACS510 / ACS580 VFD Control Cabinet

**分类**：电气自动化设计

| 字段 | 内容 |
|---|---|
| 标题 EN | `ABB ACS510 / ACS580 VFD Control Cabinet` |
| 标题 ZH | `ABB ACS510 / ACS580 变频器控制柜` |
| Slug | `abb-acs510-acs580-vfd-control-cabinet` |

**摘要 EN**
> Variable frequency drive cabinets built around ABB ACS510/ACS580 drives, with PID and multi-pump control logic.

**摘要 ZH**
> 基于 ABB ACS510/ACS580 变频器的变频控制柜，含 PID 调节与多泵轮换控制逻辑。

**详细介绍 EN**
> A drive in a cabinet is not just a drive on a mounting plate — heat, harmonics and EMC decide whether it survives its first summer. We size the enclosure for the actual thermal load, fit reactors and filtering where the installation calls for it, and program the control logic (PID, duty rotation, sleep/wake) rather than leaving it to default parameters.
>
> **Typical applications** — pump and fan energy saving · constant-pressure water supply · multi-pump duty rotation · conveyor and mixer drives
>
> **What we deliver** — drive sizing and thermal calculation · cabinet fabrication and wiring · drive parameterisation and control programming · factory acceptance test · commissioning

**详细介绍 ZH**
> 变频柜不是把变频器装在安装板上就完事——散热、谐波与 EMC 决定它能否熬过第一个夏天。我们按实际热负荷选定柜体，按现场需要配置电抗器与滤波，并实际编写控制逻辑（PID、多泵轮换、休眠唤醒），而不是沿用默认参数。
>
> **典型应用** —— 泵与风机节能 · 恒压供水 · 多泵轮换 · 输送与搅拌设备驱动
>
> **我们交付什么** —— 变频器选型与热计算 · 柜体制作与接线 · 变频参数整定与控制编程 · 出厂验收测试 · 现场调试

---

### 产品 8 · RO / EDI / MBR Water Treatment Control Panel

**分类**：水处理系统设备及自动化设计　|　**建议首页精选**：是

| 字段 | 内容 |
|---|---|
| 标题 EN | `RO / EDI / MBR Water Treatment Control Panel` |
| 标题 ZH | `水处理系统控制柜（RO / EDI / A2O / MBR）` |
| Slug | `ro-edi-mbr-water-treatment-control-panel` |

**摘要 EN**
> Control panels for RO, EDI, A2O and MBR water treatment processes, with SCADA and remote monitoring.

**摘要 ZH**
> 面向 RO、EDI、A2O、MBR 等水处理工艺的控制柜，配套 SCADA 与远程监控。

**详细介绍 EN**
> Water treatment control is process control, not just motor starting: membrane flush cycles, conductivity and pH interlocks, dosing ratios and CIP sequences all have to be right or the plant damages its own consumables. We build the panel and write the process logic together, so the sequence matches the actual treatment train.
>
> **Typical applications** — RO and EDI pure water systems · municipal and industrial wastewater (A2O, MBR) · pump station automation · water quality monitoring and reporting
>
> **What we deliver** — process control logic · panel fabrication and wiring · PLC and SCADA programming · remote monitoring setup · commissioning and operator training

**详细介绍 ZH**
> 水处理控制属于工艺控制，不只是电机启停：膜冲洗周期、电导率与 pH 联锁、加药配比、CIP 清洗顺序，任何一项出错都会损耗系统自身的耗材。我们把柜体制作与工艺逻辑一起做，确保控制顺序与实际处理工艺段匹配。
>
> **典型应用** —— RO 与 EDI 纯水系统 · 市政与工业污水（A2O、MBR） · 泵站自动化 · 水质监测与报表
>
> **我们交付什么** —— 工艺控制逻辑 · 柜体制作与接线 · PLC 与 SCADA 编程 · 远程监控部署 · 现场调试与操作培训

---

### 产品 9 · WinCC HMI & SCADA Programming Service

**分类**：SCADA及HMI软件设计及编程

| 字段 | 内容 |
|---|---|
| 标题 EN | `WinCC HMI & SCADA Programming Service` |
| 标题 ZH | `上位机及 HMI 软件设计编程服务` |
| Slug | `wincc-hmi-scada-programming-service` |

**摘要 EN**
> HMI and SCADA screen design and programming on WinCC and TIA Portal, delivered with source files.

**摘要 ZH**
> 基于 WinCC 与 TIA Portal 的 HMI／上位机画面设计与编程，交付含源文件。

**详细介绍 EN**
> An operator screen is where your plant's usability is decided. We design the screen hierarchy around how operators actually work — overview, area, detail, alarm, trend — rather than reproducing the P&ID one-to-one. Alarms are prioritised so that a real fault is not buried under nuisance messages.
>
> **Typical applications** — new plant HMI/SCADA · replacement of obsolete visualisation · adding trending, alarms and reporting to an existing system · multi-language operator screens for export machinery
>
> **What we deliver** — screen hierarchy and navigation design · WinCC / TIA Portal project · alarm and trend configuration · reporting · source files and documentation · operator training

**详细介绍 ZH**
> 操作画面决定了工厂的实际易用性。我们按操作员的真实工作方式设计画面层级——总览、区域、详情、报警、趋势，而不是把 P&ID 一比一搬上屏幕。报警按优先级分级，避免真实故障被无关提示淹没。
>
> **典型应用** —— 新建工厂 HMI/SCADA · 老旧监控系统替换 · 为既有系统增加趋势、报警与报表 · 出口设备的多语言操作画面
>
> **我们交付什么** —— 画面层级与导航设计 · WinCC / TIA Portal 工程 · 报警与趋势组态 · 报表 · 源文件与文档 · 操作培训

---

### 产品 10 · PLC Programming & Commissioning Service

**分类**：SCADA及HMI软件设计及编程　*（若想归到工业自动化设计，告知即可）*

| 字段 | 内容 |
|---|---|
| 标题 EN | `PLC Programming & Commissioning Service` |
| 标题 ZH | `PLC 软件编程与调试服务` |
| Slug | `plc-programming-commissioning-service` |

**摘要 EN**
> PLC programming, simulation testing and commissioning for new systems or existing plant, remote or on-site.

**摘要 ZH**
> 面向新建系统或既有工厂的 PLC 编程、模拟测试与调试，支持远程与现场两种方式。

**详细介绍 EN**
> We take the process description and turn it into structured, commented, maintainable code — then prove it in simulation before it touches your plant. Programs are handed over with source and documentation, so you are not locked to us for the next change.
>
> **Typical applications** — new machine or line programming · rewriting undocumented legacy programs · adding functions to a running plant · troubleshooting and optimisation
>
> **What we deliver** — control narrative review · structured PLC program with comments · offline simulation test · on-site or remote commissioning · source code and documentation handover

**详细介绍 ZH**
> 我们把工艺说明转化为结构清晰、注释完整、可维护的程序，并在接触现场设备之前先用模拟验证。交付包含源码与文档——下一次修改，你不必被我们绑定。
>
> **典型应用** —— 新设备或产线编程 · 无文档的老程序重写 · 为在运工厂增加功能 · 故障排查与优化
>
> **我们交付什么** —— 控制方案评审 · 带注释的结构化 PLC 程序 · 离线模拟测试 · 现场或远程调试 · 源码与文档交付

---

### 产品 11 · IIoT PLC Cloud Monitoring System

**分类**：SCADA及HMI软件设计及编程　|　**建议首页精选**：是

| 字段 | 内容 |
|---|---|
| 标题 EN | `IIoT PLC Cloud Monitoring System` |
| 标题 ZH | `PLC 远程监控与云数据系统（含手机 APP）` |
| Slug | `iiot-plc-cloud-monitoring-system` |

**摘要 EN**
> Remote monitoring of PLC-controlled plant from phone or browser, with historical data and alarm push.

**摘要 ZH**
> 通过手机或浏览器远程监控 PLC 控制的设备，支持历史数据与报警推送。

**详细介绍 EN**
> Equipment sold overseas is equipment you cannot walk up to. Cloud monitoring closes that gap: live status, historical trends and alarm push, so a fault is diagnosed before an engineer books a flight. Data collection runs on the PLC side over OPC UA/MQTT, so no change to the control logic is required.
>
> **Typical applications** — remote plant supervision across sites · after-sales support for exported machinery · unmanned pump and water stations · energy and production data collection
>
> **What we deliver** — gateway and data collection setup · cloud platform configuration · mobile and browser dashboards · alarm push rules · historical data and reporting

**详细介绍 ZH**
> 卖到海外的设备，是你走不到跟前的设备。云监控补上这个缺口：实时状态、历史趋势、报警推送，让故障在工程师订机票之前就被定位。数据采集在 PLC 侧通过 OPC UA/MQTT 完成，不需要改动原有控制逻辑。
>
> **典型应用** —— 跨厂区远程监管 · 出口设备售后支持 · 无人值守泵站与水站 · 能耗与产量数据采集
>
> **我们交付什么** —— 网关与数据采集部署 · 云平台配置 · 手机与浏览器看板 · 报警推送规则 · 历史数据与报表

---

## 三、交付流程（`彩页.png` 的内容，转成结构化文字）

这 12 步适合放 About 页的「多栏要点」积木块，或做成独立的「合作流程」区块。全公司通用，不必每个产品重复。

| # | EN | ZH |
|---|---|---|
| 01 | Provide technical requirement documents & equipment drawings | 提供技术需求文件与设备图纸 |
| 02 | Submit quotation with detailed BOM (2 business days) | 提交含详细 BOM 的报价（2 个工作日） |
| 03 | Pay deposit & sign service agreement | 支付定金、签署协议 |
| 04 | Draft electrical & automation drawings (3 business days) | 绘制电气与自控图纸（3 个工作日） |
| 05 | Fabricate enclosure & power distribution cabinets (5–10 business days) | 柜体与配电柜制作（5–10 个工作日） |
| 06 | Perform internal wiring of distribution cabinets | 柜内接线 |
| 07 | Develop PLC & HMI/SCADA programming | PLC 与 HMI/SCADA 编程 |
| 08 | Conduct on-site commissioning & FAT | 本地调试与出厂验收测试（FAT） |
| 09 | Remote video verification by client | 客户远程视频确认功能 |
| 10 | Package goods with industrial-grade protection | 工业级包装 |
| 11 | Client pays balance payment | 客户支付尾款 |
| 12 | Arrange shipment & delivery | 安排发货与交付 |

> 软件类服务的流程较短（7 步，见素材包 `待P/软件服务流程.txt`），可在产品 9/10/11 的详细介绍里单独说明。

---

## 待确认

1. 上面 11 个产品的英文名与摘要是否准确——**尤其是我写的"典型应用"，如果有哪类你们实际不做，删掉**，写进去会引来做不了的询盘
2. 首页精选建议了 4 个（1、3、8、11），覆盖控制柜、整厂系统、水处理、云监控四条线；首页最多显示 6 个，可再加
3. 产品 10 的分类归属
4. 交付流程第 11 步：素材里写的是「客户支付 70% 尾款」，加上第 3 步的定金不足 100%，数字对不上——按实际比例修正后再上线
