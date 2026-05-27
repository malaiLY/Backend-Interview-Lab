# Spring 全家桶面试八股文（优化版）

---

## 一、Spring 核心

---

### 1.1 基础概念

---

#### 1. 什么是 IOC？（高）

**IOC（Inversion of Control，控制反转）** 是一种设计思想，将对象的创建、依赖关系的维护交给容器管理，而不是由程序直接 new。Spring 的 IOC 容器通过读取配置元数据（XML、注解、Java Config），装配和管理 Bean。

**优点**：
- **解耦**：对象之间的依赖关系由容器管理，只需声明依赖，降低了耦合。
- **易于测试**：方便注入 Mock 对象，实现单元测试。
- **统一管理生命周期**：容器负责 Bean 的完整生命周期，可扩展（如后置处理器）。
- **集中配置**：依赖关系集中管理，便于维护和变更。
- **支持 AOP、声明式事务等高级特性**。

**缺点**：
- **学习成本**：概念较多，需要理解容器机制。
- **配置复杂**：基于 XML 时配置冗长（注解后有所缓解）。
- **运行时开销**：反射、代理等技术会略微影响性能，启动时间增加。
- **黑盒感**：对象依赖关系隐式，调试可能不易跟踪。

---

#### 2. 什么是 AOP？（高）

**AOP（Aspect Oriented Programming，面向切面编程）** 是对 OOP 的补充，用于将横切关注点（如日志、事务、权限）与业务逻辑分离，提高模块化。

**核心概念**：
- **切面（Aspect）**：横切关注点的模块化，由通知和切点组成。
- **连接点（Join point）**：程序执行过程中的某个点（如方法调用）。
- **通知（Advice）**：在切点上执行的增强逻辑，分为前置、后置、环绕、异常、返回通知。
- **切点（Pointcut）**：匹配连接点的表达式。
- **织入（Weaving）**：将切面应用到目标对象并创建代理的过程。

**Spring AOP 实现**：基于动态代理（JDK 动态代理或 CGLIB），在运行时生成代理对象，织入增强逻辑。

**应用场景**：日志记录、性能统计、安全验证、事务管理、异常处理等。

---

#### 3. Spring 框架中都用到了哪些设计模式？（中）

| 设计模式         | Spring 中的体现                                              |
| ---------------- | ------------------------------------------------------------ |
| **单例模式**     | Bean 默认作用域为 singleton                                  |
| **工厂模式**     | `BeanFactory`、`ApplicationContext` 作为 Bean 工厂           |
| **代理模式**     | AOP 实现基于 JDK 或 CGLIB 动态代理                           |
| **模板方法模式** | `JdbcTemplate`、`RestTemplate`、`JmsTemplate` 等，定义算法骨架 |
| **观察者模式**   | 事件监听机制，`ApplicationEvent`、`ApplicationListener`      |
| **适配器模式**   | `HandlerAdapter`（Spring MVC），适配不同的 Controller        |
| **策略模式**     | 资源访问 `Resource`、事务管理 `PlatformTransactionManager` 的不同实现 |
| **装饰器模式**   | `BeanWrapper` 对 Bean 的属性访问进行装饰                     |
| **责任链模式**   | 过滤器链、拦截器链（HandlerInterceptor）                     |
| **建造者模式**   | `BeanDefinitionBuilder`、`MockMvcBuilders` 等                |

---

### 1.2 Bean 管理

---

#### 4. Bean 的注入方式有哪些？（中）

1. **构造器注入**：通过构造方法传入依赖，强制依赖不可为空，有利于不可变对象。
2. **Setter 注入**：通过 setter 方法注入依赖，可选依赖更灵活。
3. **字段注入**：使用 `@Autowired` 直接标注在字段上，简洁但不推荐（不利于测试，隐藏依赖）。
4. **方法注入**：普通方法上标注 `@Autowired`，Spring 会调用方法注入参数。
5. **接口注入**：Bean 实现特定接口（如 `ApplicationContextAware`）获取容器注入，不常用。

推荐顺序：构造器注入 > Setter 注入，尽量避免字段注入。

---

#### 5. Bean 的生命周期是怎样的？（中）

**大致流程**：

1. **实例化**：容器通过反射创建 Bean 实例。
2. **属性填充**：注入依赖属性（`@Autowired`、`@Value` 等）。
3. **Aware 回调**：如果 Bean 实现了 `BeanNameAware`、`BeanFactoryAware`、`ApplicationContextAware` 等，调用对应方法。
4. **BeanPostProcessor 前置处理**：执行 `postProcessBeforeInitialization`。
5. **初始化**：如果实现了 `InitializingBean`，调用 `afterPropertiesSet()`；或者配置了 `init-method`，执行该方法。
6. **BeanPostProcessor 后置处理**：执行 `postProcessAfterInitialization`，AOP 代理多在此处生成。
7. **就绪**：Bean 可用。
8. **销毁**：容器关闭时，如果实现了 `DisposableBean`，调用 `destroy()`；或者配置了 `destroy-method`，执行该方法。

**扩展点**：`BeanFactoryPostProcessor`（处理 BeanDefinition）、`BeanPostProcessor`（处理 Bean 实例）。

---

#### 6. Spring 如何解决循环依赖？（中）

**循环依赖**：A 依赖 B，B 依赖 A，形成闭环。Spring 通过**三级缓存**解决单例 Bean 的构造器注入以外的循环依赖。

**三级缓存**：
- `singletonObjects`：一级缓存，完全初始化的单例 Bean。
- `earlySingletonObjects`：二级缓存，存放早期暴露的对象（尚未属性填充）。
- `singletonFactories`：三级缓存，存放可以生成早期引用的工厂（`ObjectFactory`）。

**解决流程**（A 和 B 循环依赖，先创建 A）：
1. 创建 A 实例（构造器），存入三级缓存（暴露工厂，能提前获取 A 的引用）。
2. 填充 A 的属性，发现需要 B → 去创建 B。
3. 创建 B 实例，填充 B 的属性时发现需要 A → 从三级缓存获取 A 的早期引用，注入。
4. B 完成初始化，放入一级缓存。
5. A 拿到 B 的正式实例，完成初始化，放入一级缓存。

**注意**：
- 只能解决单例的 setter/字段注入循环依赖。
- **构造器注入循环依赖无法解决**，会抛出 `BeanCurrentlyInCreationException`。
- 原型作用域循环依赖也无法解决。

---

#### 7. Spring 中的 Bean 都是单例的吗？（低）

**不都是**。Spring 提供了多种作用域：
- **singleton**（默认）：每个容器只有一个共享实例。
- **prototype**：每次获取都创建新实例。
- **request**：每个 HTTP 请求拥有独立实例（Web 环境）。
- **session**：每个 HTTP 会话拥有独立实例（Web 环境）。
- **application / websocket** 等（特定环境）。

所以，默认是单例，但可以根据需要改为其他作用域。

---

### 1.3 事务管理

---

#### 8. Spring 事务管理方式有哪些？（中）

**1. 编程式事务**：通过 `TransactionTemplate` 或 `PlatformTransactionManager` 手动编码控制事务边界。
- 优点：粒度精确，灵活。
- 缺点：代码侵入性强，重复模板代码。

**2. 声明式事务**：使用 `@Transactional` 注解或 XML 配置，基于 AOP 实现。
- 优点：非侵入，简洁，推荐使用。
- 原理：Spring 生成代理对象，在方法前后通过 `TransactionInterceptor` 调用事务管理器进行开启、提交、回滚。
- 属性：传播行为、隔离级别、超时、只读、回滚规则等。

---

#### 9. Spring 事务失效的几种情况？（低）

事务失效原因：
1. **方法非 public 修饰**：Spring 事务代理默认只能拦截 public 方法，非 public 方法事务不生效。
2. **自调用问题**：同一个类内部方法调用，不经过代理对象，事务失效。解决方法：通过 `AopContext.currentProxy()` 调用，或拆分到不同 Bean。
3. **异常被捕获未抛出**：`@Transactional` 默认回滚 `RuntimeException` 和 `Error`。如果方法内部 catch 异常并未抛出，事务不感知，不会回滚。可指定 `rollbackFor = Exception.class`，并确保异常能传播。
4. **非受检异常未指定回滚**：抛出编译期异常（Exception）时默认不回滚，需设置 `rollbackFor`。
5. **数据库引擎不支持事务**：如 MyISAM 引擎不支持事务。
6. **未开启事务管理**：未配置 `@EnableTransactionManagement` 或未注入事务管理器。
7. **线程池调用**：事务上下文通过 ThreadLocal 传递，新线程内方法不在原事务范围，失效。
8. **传播行为设置错误**：例如 `Propagation.NOT_SUPPORTED` 以非事务执行，或 `Propagation.REQUIRES_NEW` 挂起当前事务，也会使外层回滚不影响内层。

---

## 二、Spring MVC

---

### 2.1 MVC 分层与请求流程

---

#### 10. MVC 分层是什么？（中）

MVC 是一种软件架构模式，将应用程序分为三层，各司其职，降低耦合：

- **Model（模型）**：负责数据和业务逻辑。直接操作数据库，处理业务规则，包含实体类、Service、DAO 等。
- **View（视图）**：负责界面展示。将模型数据渲染为用户可见的页面（JSP、Thymeleaf、Freemarker 或前后端分离下的 JSON 数据）。
- **Controller（控制器）**：负责接收用户请求，调用模型处理，并返回视图或数据。是 Model 和 View 的协调者。

**优点**：职责清晰，便于分工协作、维护和测试；各层可独立演进（如更换视图技术不影响业务逻辑）。

---

#### 11. Spring MVC 工作原理 / 请求处理流程？（中）

**传统开发模式请求处理流程**

传统模式下，视图通常由服务端渲染（JSP、Thymeleaf 等），流程如下：

1. 客户端发送请求到 **DispatcherServlet**（前端控制器）。
2. DispatcherServlet 调用 **HandlerMapping**（处理器映射器），根据请求 URL 找到对应的 Handler（Controller 方法）。
3. DispatcherServlet 调用 **HandlerAdapter**（处理器适配器），执行 Handler。
4. Handler（Controller）调用 Service 处理业务，返回 **ModelAndView**（包含视图名和模型数据）。
5. HandlerAdapter 将 ModelAndView 返回给 DispatcherServlet。
6. DispatcherServlet 调用 **ViewResolver**（视图解析器），根据视图名解析为具体的 View 对象（如 `/WEB-INF/views/user.jsp`）。
7. DispatcherServlet 将模型数据交给 View，View 进行渲染（如 JSP 编译执行），生成 HTML 响应。
8. 响应返回客户端。

**前后端分离请求处理流程**

前后端分离下，后端只返回 JSON 数据，不再负责页面渲染：

1. 客户端（浏览器/Ajax/App）发送 HTTP 请求到 **DispatcherServlet**。
2. DispatcherServlet 通过 HandlerMapping 找到对应的 Controller 方法（通常标注 `@RestController` 或 `@ResponseBody`）。
3. HandlerAdapter 执行 Controller 方法。
4. Controller 处理业务后，直接返回 Java 对象（不是 ModelAndView）。
5. Spring 通过 **HttpMessageConverter**（消息转换器，如 Jackson）将返回对象序列化为 JSON 字符串，写入响应体。
6. 视图渲染步骤被完全跳过（没有 ViewResolver 参与）。
7. 响应 JSON 数据直接返回客户端，客户端自行渲染页面。

---

## 三、MyBatis

---

### 3.1 Mapper 代理与 SQL 安全

---

#### 12. 为什么 Mapper 只需要声明接口和编写 XML，不需要实现类？（中）

MyBatis 通过 **动态代理（MapperProxy）** 机制为 Mapper 接口生成实现类。流程如下：

1. **解析 XML 或注解**：MyBatis 启动时，加载映射文件（XML）或注解，将 SQL 语句与接口方法一一绑定，封装成 `MappedStatement`，存储于 `Configuration` 对象中，键为接口全限定名 + 方法名。
2. **获取 Mapper**：调用 `SqlSession.getMapper(Mapper.class)` 时，MyBatis 使用 `MapperProxyFactory` 创建代理对象。
3. **动态代理**：`MapperProxy` 实现 `InvocationHandler`，当调用接口方法时，`invoke` 方法被触发：
   - 根据方法所属接口和方法名，找到对应的 `MappedStatement`。
   - 封装参数（将方法参数转换为 SQL 参数）。
   - 调用 `SqlSession` 执行对应的 SQL（select/insert/update/delete）。
   - 通过结果映射将数据库返回结果转换为接口方法的返回类型。

因此，开发者只需定义接口和 SQL 映射，MyBatis 通过代理自动完成实现。

---

#### 13. MyBatis 里 `#{}` 和 `${}` 的区别？（中）

| 对比项       | #{}                                                      | ${}                                                 |
| ------------ | -------------------------------------------------------- | --------------------------------------------------- |
| **处理方式** | 预编译占位符 `?`，替换为参数值，生成 `PreparedStatement` | 直接字符串拼接，替换为变量值，生成普通 `Statement`  |
| **SQL注入**  | 安全，可防止 SQL 注入                                    | 不安全，存在 SQL 注入风险                           |
| **参数位置** | 可用于 SQL 的任何参数位置（如值、条件）                  | 主要用于动态表名、列名、ORDER BY 等无法预编译的部分 |
| **类型处理** | 自动进行 JDBC 类型转换                                   | 原样输出，需手动保证格式（如字符串需自己加引号）    |
| **示例**     | `SELECT * FROM user WHERE id = #{id}`                    | `SELECT * FROM ${tableName} WHERE id = #{id}`       |

**使用建议**：
- 所有能使用 `#{}` 的地方都应使用 `#{}`，防止 SQL 注入。
- 仅当必须动态指定表名、列名、排序字段等标识符时，才使用 `${}`，且必须对传入值做严格的白名单校验，绝对不能直接拼接用户输入。

---

## 四、Spring Boot

---

### 4.1 自动装配

---

#### 14. Spring Boot 自动装配原理？（中）

**自动装配**是 Spring Boot 的核心特性，它基于约定的配置和条件化注解，在项目启动时自动将所需的 Bean 注册到 IOC 容器，极大简化了 Spring 应用的搭建和配置。

**核心工作原理**：

1. **入口注解**  
   `@SpringBootApplication` 是一个复合注解，内部包含 `@EnableAutoConfiguration`，它是自动装配的总开关。

2. **导入选择器**  
   `@EnableAutoConfiguration` 通过 `@Import(AutoConfigurationImportSelector.class)` 导入关键类。在 Spring Boot 启动时，`AutoConfigurationImportSelector` 负责决定要加载哪些自动配置类。

3. **候选配置的加载**  
   - **Spring Boot 2.7 之前**：读取 `META-INF/spring.factories` 文件中 `org.springframework.boot.autoconfigure.EnableAutoConfiguration` 键对应的所有自动配置类列表。
   - **Spring Boot 2.7 及以后**：改为读取 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 文件，一行一个配置类全限定名，避免 `spring.factories` 的臃肿。

4. **条件化过滤**  
   每个自动配置类（如 `DataSourceAutoConfiguration`）上都标注了大量条件注解，根据当前项目的依赖和已有 Bean 决定是否生效：
   - `@ConditionalOnClass`：当 classpath 中存在指定类时生效（如存在 `DataSource` 类才配置数据源）。
   - `@ConditionalOnMissingBean`：容器中不存在指定 Bean 时才创建默认的（用户可自定义覆盖）。
   - `@ConditionalOnProperty`：根据配置文件中的属性值决定是否启用。
   - `@ConditionalOnBean`：存在某个 Bean 时才生效。
   
   通过层层过滤，只有满足条件的配置类才会真正被应用，从而实现了"自动"装配。

**示例**：  
`DataSourceAutoConfiguration` 上标注了 `@ConditionalOnClass({ DataSource.class, EmbeddedDatabaseType.class })`，意味着只有当项目中存在数据库相关类时，才会尝试自动配置数据源；如果用户自己定义了 `DataSource` Bean，则 `@ConditionalOnMissingBean` 会使其跳过默认配置。

**自定义自动装配步骤**：
1. 创建配置类，编写需要自动注册的 Bean。
2. 在 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 文件中添加该配置类的全限定名。
3. 使用 `@ConditionalOnXXX` 等注解控制生效条件。
4. 通过 `spring-boot-autoconfigure` 模块打包或直接在本项目中提供，即可被自动装配。

自动装配让开发者专注于业务逻辑，而无需关心繁杂的框架集成配置。

---

## 五、Spring Cloud 微服务

---

### 5.1 微服务基础

---

#### 15. Spring Cloud 和 Spring Boot 的区别？（中）

| 对比项       | Spring Boot                                    | Spring Cloud                                                 |
| ------------ | ---------------------------------------------- | ------------------------------------------------------------ |
| **定位**     | 快速构建单个 Spring 应用的脚手架               | 分布式微服务系统的一站式解决方案                             |
| **核心能力** | 自动装配、内嵌服务器、简化 Spring 应用开发配置 | 服务发现、配置中心、负载均衡、熔断降级、网关、消息总线等     |
| **依赖关系** | 独立运行，不依赖 Spring Cloud                  | **基于 Spring Boot 构建**，每个微服务都是一个 Spring Boot 应用 |
| **应用范围** | 单体应用或微服务中的单个服务                   | 管理多个微服务组成的分布式系统                               |
| **关注点**   | 单个服务的开发效率                             | 多个服务间的协调与治理                                       |

简而言之：Spring Boot 是"如何快速开发一个服务"，Spring Cloud 是"如何让多个服务协同工作"。

---

#### 16. 微服务的特点 / 优缺点？（中）

**特点**：
- **单一职责**：每个服务专注一个业务领域，独立开发、部署、扩展。
- **独立部署**：服务可独立构建、测试、发布，不影响其他服务。
- **去中心化**：每个服务可选用最适合的技术栈和数据库。
- **轻量级通信**：服务间通过 HTTP/REST、gRPC 或消息队列通信。
- **基础设施自动化**：依赖 CI/CD、容器化、监控等自动化基础设施。

**优点**：
- 模块边界清晰，易于理解和维护。
- 技术栈灵活，可针对不同场景选型。
- 可独立扩缩容，资源利用更高效。
- 故障隔离，一个服务挂掉不影响全局。
- 团队可并行开发，交付效率高。

**缺点**：
- 分布式固有的复杂性（网络延迟、数据一致性、分布式事务）。
- 运维成本高，需要服务发现、配置中心、链路追踪等基础设施。
- 调试困难，跨服务调用链难以跟踪。
- 接口兼容性要求高，变更需协调。
- 服务间通信开销，网络延迟增加。

---

### 5.2 核心组件

---

#### 17. 常见的微服务组件有哪些？（中）

| 组件               | 作用                                   | 主流实现                                    |
| ------------------ | -------------------------------------- | ------------------------------------------- |
| **服务注册与发现** | 管理服务实例的注册和发现，屏蔽动态变化 | Eureka、Nacos、Consul、Zookeeper            |
| **配置中心**       | 集中管理各服务配置，支持动态刷新       | Spring Cloud Config、Nacos、Apollo          |
| **API 网关**       | 统一入口，负责路由、认证、限流、日志等 | Zuul、Spring Cloud Gateway、Kong            |
| **负载均衡**       | 在多个服务实例间分发请求               | Ribbon（已停更）、Spring Cloud LoadBalancer |
| **远程调用**       | 服务间 HTTP 调用，简化 RPC             | Feign、OpenFeign、RestTemplate              |
| **熔断降级**       | 防止故障级联传播，提供失败回退         | Hystrix（已停更）、Resilience4j、Sentinel   |
| **链路追踪**       | 跟踪请求在多个服务间的完整调用链       | Sleuth + Zipkin、SkyWalking、Jaeger         |
| **消息驱动**       | 通过消息中间件实现异步通信和削峰填谷   | Spring Cloud Stream、RabbitMQ、Kafka        |
| **分布式事务**     | 处理跨服务的数据库一致性               | Seata、RocketMQ 事务消息                    |

---

#### 18. 负载均衡的意义是什么？（中）

负载均衡（Load Balancing）将网络请求分散到多个服务器实例上处理，其意义在于：

- **提高系统吞吐量**：多节点并发处理请求，充分利用集群资源。
- **增强高可用性**：当某节点故障时，自动将请求转发到健康节点，避免单点故障。
- **提升伸缩性**：可以通过增加或减少节点数量，灵活应对流量变化。
- **优化资源利用**：根据节点负载情况智能分配请求，避免部分节点过载、部分节点空闲。
- **简化客户端**：客户端只需知道负载均衡器地址，无需关心后端实例变化。

---

#### 19. 负载均衡常见实现策略有哪些？（中）

**服务端负载均衡**：
- 独立部署负载均衡器（如 Nginx、F5），客户端请求先到均衡器，再转发给后端。
- 常见算法：轮询、加权轮询、最少连接、源地址哈希等。

**客户端负载均衡**：
- 负载均衡逻辑集成在消费方，从服务注册中心获取实例列表，本地选择后直接调用。
- 代表：Ribbon、Spring Cloud LoadBalancer。

**常见算法**：
| 策略                    | 说明                                                   |
| ----------------------- | ------------------------------------------------------ |
| **轮询（Round Robin）** | 按顺序轮流分发，简单公平                               |
| **加权轮询**            | 给不同性能的节点分配不同权重，按权重比例分发           |
| **最少连接**            | 优先发给当前连接数最少的节点                           |
| **源地址哈希**          | 对客户端 IP 哈希，同一 IP 总是落到同一节点（会话保持） |
| **随机**                | 随机选择一个节点                                       |
| **响应时间**            | 优先发给响应最快的节点                                 |

---

#### 20. 服务熔断、服务降级是什么？为什么需要熔断降级？（中）

**服务熔断**：
- 当某个服务调用失败率达到阈值（如 50%），熔断器自动断开，后续请求不再调用该服务，而是直接返回错误或执行降级逻辑。
- 一段时间后，熔断器进入半开状态，试探性放行部分请求，如果成功则关闭熔断器恢复正常，失败则继续保持熔断。
- 类似电路保险丝，防止故障扩散。

**服务降级**：
- 当系统压力过大或服务不可用时，放弃执行非核心功能，提供有损的兜底方案（如返回默认值、提示"稍后再试"），保证核心业务可用。
- 降级是主动的、有预案的退让策略。

**为什么需要熔断降级**：
- **防止故障雪崩**：微服务间存在级联依赖，一个服务故障可能拖垮整个调用链。熔断能快速失败，阻止故障蔓延。
- **保障系统韧性**：在高并发或异常情况下，通过降级释放资源，确保核心链路存活。
- **提升用户体验**：快速返回有损结果，比长时间等待或白屏更好。
- **资源保护**：避免线程阻塞耗尽、连接池打满等资源问题，防止系统崩溃。