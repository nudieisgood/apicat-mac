import {
  Button,
  InputNumber,
  Modal,
  Progress,
  Input,
  Select,
  Tabs,
  Table,
  Radio,
  RadioGroup,
  Spin,
  Upload,
  Tag,
  Collapse,
  Textarea,
  Menu,
  Dropdown,
  message,
  Form,
  Layout,
  Tooltip,
  Breadcrumb,
  Popover,
  Tree,
  Checkbox,
  Switch,
} from "ant-design-vue";
import "ant-design-vue/dist/reset.css";

export default {
  install: (app) => {
    app.use(Button);
    app.use(InputNumber);
    app.use(Modal);
    app.use(Progress);
    app.use(Input);
    app.use(Select);
    app.use(Tabs);
    app.use(Table);
    app.use(Radio);
    app.use(RadioGroup);
    app.use(Spin);
    app.use(Upload);
    app.use(Tag);
    app.use(Collapse);
    app.use(Textarea);
    app.use(Menu);
    app.use(Dropdown);
    app.use(message);
    app.use(Form);
    app.use(Layout);
    app.use(Tooltip);
    app.use(Breadcrumb);
    app.use(Popover);
    app.use(Tree);
    app.use(Checkbox);
    app.use(Switch);
  },
};
