import { test, beforeEach, afterEach } from "bun:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import {
  createSegmentedControl, createTabs, createDisclosure, createDialog, createMenu,
  createTooltip, createRange, createField, createToastRegion, createInstrument,
  applyTheme, renderIcon, designTokens,
} from "../lib/index.js";
let view, document;
beforeEach(() => { view = new Window(); document = view.document; globalThis.window = view; });
afterEach(async () => { delete globalThis.window; await view.happyDOM.abort(); view.close(); });
const mount = html => { document.body.innerHTML = html; return document.body.firstElementChild; };
const key = (element, value) => { const event = new view.KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true }); element.dispatchEvent(event); return event; };
const segmentHtml = '<div aria-label="Profile"><button data-ui-value="a">A</button><button data-ui-value="b" disabled>B</button><button data-ui-value="c">C</button></div>';
const tabsHtml = '<div><div data-ui-tablist aria-label="Details"><button data-ui-tab="a">A</button><button data-ui-tab="b" disabled>B</button><button data-ui-tab="c">C</button></div><div data-ui-panel="a">A panel</div><div data-ui-panel="b">B panel</div><div data-ui-panel="c">C panel</div></div>';

test("segmented choices skip disabled buttons, wrap, clear custom state, and restore markup", () => {
  const root = mount(segmentHtml), original = root.outerHTML, changes = [];
  const control = createSegmentedControl(root, { onChange: value => changes.push(value) });
  const [a,b,c] = root.querySelectorAll("button"); a.focus(); key(a, "ArrowRight");
  assert.equal(control.value, "c"); assert.equal(document.activeElement, c);
  key(c, "ArrowRight"); assert.equal(control.value, "a");
  key(a, "End"); assert.equal(control.value, "c");
  control.clear(); assert.equal(control.value, ""); assert.equal(a.tabIndex, 0);
  assert.equal(c.getAttribute("aria-pressed"), "false");
  control.setValue("c"); assert.deepEqual(changes, ["c", "a", "c", "c"]);
  assert.throws(() => control.setValue("b"), RangeError);
  control.destroy(); control.destroy(); assert.equal(root.outerHTML, original);
  c.click(); assert.throws(() => control.setValue("a"), /destroyed/);
});
test("all-disabled segments initialize without an unreachable selected item", () => {
  const root = mount('<div><button data-ui-value="a" disabled>A</button></div>');
  const control = createSegmentedControl(root); assert.equal(control.value, ""); assert.equal(root.firstChild.tabIndex, -1); control.destroy();
});
test("segments honor vertical orientation and RTL arrow direction", () => {
  for (const [orientation, direction, pressed] of [["vertical", "ltr", "ArrowDown"], ["horizontal", "rtl", "ArrowLeft"]]) {
    const root = mount(segmentHtml); root.style.direction = direction;
    const control = createSegmentedControl(root, { orientation });
    key(root.firstChild, pressed); assert.equal(control.value, "c"); control.destroy();
  }
});
test("segmented initializer rejects duplicate values without changing markup", () => {
  const root = mount('<div><button data-ui-value="a">A</button><button data-ui-value="a">B</button></div>'), original = root.outerHTML;
  assert.throws(() => createSegmentedControl(root)); assert.equal(root.outerHTML, original);
});
test("tabs link panels, skip disabled tabs, and restore their original attributes", () => {
  const root = mount(tabsHtml), original = root.outerHTML;
  const tabs = createTabs(root), [a,b,c] = root.querySelectorAll("button");
  assert.equal(document.getElementById(a.getAttribute("aria-controls")).getAttribute("aria-labelledby"), a.id);
  assert.equal(root.querySelector('[data-ui-panel="a"]').hidden, false);
  key(a,"ArrowRight"); assert.equal(tabs.value,"c"); assert.equal(root.querySelector('[data-ui-panel="a"]').hidden,true);
  key(c,"Home"); assert.equal(tabs.value,"a");
  assert.equal(key(a,"ArrowDown").defaultPrevented,false);
  assert.throws(() => tabs.setValue("b")); tabs.destroy(); assert.equal(root.outerHTML,original);
});
test("manual tabs move focus without changing content until activated", () => {
  const root = mount(tabsHtml), tabs = createTabs(root,{activation:"manual"}), [a,b,c] = root.querySelectorAll("button");
  key(a,"End"); assert.equal(tabs.value,"a"); assert.equal(document.activeElement,c);
  key(c,"Enter"); assert.equal(tabs.value,"c"); tabs.destroy();
});
test("vertical tabs use vertical arrows and reject missing panel relationships atomically", () => {
  const root = mount(tabsHtml), tabs = createTabs(root,{orientation:"vertical"}); key(root.querySelector("button"),"ArrowDown"); assert.equal(tabs.value,"c"); tabs.destroy();
  root.querySelector('[data-ui-panel="c"]').remove(); const original=root.outerHTML;
  assert.throws(() => createTabs(root)); assert.equal(root.outerHTML,original);
});
test("controlled disclosure returns focus when collapsing occupied content", () => {
  const root=mount('<div><button>Notes</button><div hidden><input aria-label="Inside"></div></div>'), original=root.outerHTML;
  const trigger=root.firstChild,panel=root.lastChild, control=createDisclosure(trigger,panel,{open:false});
  trigger.click(); assert.equal(control.open,true); panel.firstChild.focus(); control.setOpen(false);
  assert.equal(document.activeElement,trigger); assert.equal(trigger.getAttribute("aria-expanded"),"false");
  control.destroy(); assert.equal(root.outerHTML,original);
});
test("dialog closes with a return value, restores opener focus, and cleans listeners", () => {
  const root=mount('<div><button>Open</button><dialog aria-label="Calibration"><input aria-label="Label"><button data-ui-close>Close</button></dialog></div>');
  const opener=root.firstChild, node=root.lastChild, input=node.firstChild;
  const changes=[]; const control=createDialog(node,{initialFocus:input,onChange:open=>changes.push(open)});
  opener.focus(); control.show(); assert.equal(control.open,true); assert.equal(document.activeElement,input);
  control.close("confirmed"); assert.equal(node.returnValue,"confirmed"); assert.equal(document.activeElement,opener);
  control.show(); node.querySelector("button").click(); assert.equal(control.open,false);
  control.destroy(); assert.deepEqual(changes,[true,false,true,false]); assert.throws(()=>control.show(),/destroyed/);
});
test("dialog rejects missing labels and external initial focus before opening", () => {
  const root=mount('<div><input><dialog></dialog></div>'),dialog=root.lastChild;
  assert.throws(()=>createDialog(dialog)); dialog.setAttribute("aria-label","Dialog"); assert.throws(()=>createDialog(dialog,{initialFocus:root.firstChild})); assert.equal(dialog.open,false);
});
test("menu uses roving keyboard focus, typeahead, Escape, and selection", () => {
  const root=mount('<div><button>Actions</button><div hidden><button data-ui-menu-value="inspect">Inspect</button><button data-ui-menu-value="export" disabled>Export</button><button data-ui-menu-value="calibrate">Calibrate</button></div></div>'),original=root.outerHTML;
  const trigger=root.firstChild,popup=root.lastChild,[first,unavailable,last]=popup.children, selected=[];
  const menu=createMenu(trigger,popup,{onSelect:value=>selected.push(value)});
  key(trigger,"ArrowDown"); assert.equal(menu.open,true); assert.equal(document.activeElement,first);
  key(first,"ArrowDown"); assert.equal(document.activeElement,last);
  key(last,"i"); assert.equal(document.activeElement,first);
  key(first,"Escape"); assert.equal(menu.open,false); assert.equal(document.activeElement,trigger);
  menu.show(true); last.click(); assert.deepEqual(selected,["calibrate"]); assert.equal(document.activeElement,trigger);
  menu.destroy(); assert.equal(root.outerHTML,original); assert.throws(()=>menu.show(),/destroyed/);
});
test("outside menu interaction closes without stealing destination focus", () => {
  const root=mount('<div><button>Actions</button><div hidden><button data-ui-menu-value="a">A</button></div><input aria-label="Other"></div>');
  const menu=createMenu(root.children[0],root.children[1]); menu.show(); root.children[2].focus();
  assert.equal(menu.open,false); assert.equal(document.activeElement,root.children[2]); menu.destroy();
});
test("tooltip preserves hints and remains dismissed until focus/hover ends", () => {
  const root=mount('<div><button aria-describedby="hint">Info</button><span hidden>Supplement</span></div>'),original=root.outerHTML;
  const trigger=root.firstChild,tooltip=root.lastChild, control=createTooltip(trigger,tooltip);
  assert.match(trigger.getAttribute("aria-describedby"),/^hint ui-tooltip-/);
  trigger.focus(); assert.equal(control.open,true); key(trigger,"Escape"); assert.equal(control.open,false);
  trigger.dispatchEvent(new view.PointerEvent("pointerenter")); assert.equal(control.open,false);
  trigger.blur(); trigger.dispatchEvent(new view.PointerEvent("pointerleave")); trigger.focus(); assert.equal(control.open,true);
  control.destroy(); assert.equal(root.outerHTML,original);
});
test("tooltip persists when pointer moves from trigger onto its surface", () => {
  const root=mount('<div><button>Info</button><span hidden>Hint</span></div>'),trigger=root.firstChild,tip=root.lastChild,control=createTooltip(trigger,tip);
  trigger.dispatchEvent(new view.PointerEvent("pointerenter"));
  trigger.dispatchEvent(new view.PointerEvent("pointerleave",{relatedTarget:tip})); assert.equal(control.open,true);
  tip.dispatchEvent(new view.PointerEvent("pointerleave")); assert.equal(control.open,false); control.destroy();
});
test("native range synchronizes fill, units, native events, and reset", async () => {
  const form=mount('<form><input id="gain" aria-label="Gain" type="range" min="10" max="30" value="20"><output for="gain"></output></form>'),input=form.firstChild,output=form.lastChild;
  let updates=0;const range=createRange(input,{output,format:value=>`${value} dB`,onChange:()=>updates++});
  assert.equal(output.textContent,"20 dB"); assert.equal(input.style.getPropertyValue("--ui-range-fill"),"50%");
  range.setValue(30); assert.equal(updates,0); assert.equal(output.textContent,"30 dB");
  input.dispatchEvent(new view.Event("input")); assert.equal(updates,1); assert.equal(input.getAttribute("aria-valuetext"),"30 dB");
  form.reset(); await Promise.resolve(); assert.equal(output.textContent,"20 dB");
  range.destroy(); assert.equal(input.style.getPropertyValue("--ui-range-fill"),""); assert.equal(input.hasAttribute("aria-valuetext"),false);
  assert.throws(()=>range.setValue(1),/destroyed/);
});
test("field errors preserve hints, avoid initial invalid state, and clear when corrected", () => {
  const root=mount('<div><input type="email" required aria-describedby="hint"><p id="hint">Hint</p><p hidden>Error</p></div>'),input=root.firstChild,error=root.lastChild,original=root.outerHTML;
  const field=createField(input,{error}); assert.equal(input.hasAttribute("aria-invalid"),false);
  assert.equal(field.validate(),false); assert.equal(input.getAttribute("aria-invalid"),"true"); assert.match(input.getAttribute("aria-describedby"),/^hint ui-error-/);
  input.value="valid@example.com"; input.dispatchEvent(new view.Event("input"));
  assert.equal(input.getAttribute("aria-invalid"),"false"); assert.equal(input.getAttribute("aria-describedby"),"hint"); assert.equal(error.hidden,true);
  field.destroy(); assert.equal(error.textContent,"Error"); assert.equal(input.hasAttribute("aria-invalid"),false); assert.equal(input.value,"valid@example.com");
});
test("custom field validation and native form reset restore untouched presentation", async () => {
  const form=mount('<form><input value="ok"><p hidden></p></form>'),input=form.firstChild,error=form.lastChild;
  const field=createField(input,{error,validate:element=>element.value.trim()?null:"Required"});
  input.value=" ";assert.equal(field.validate(),false);assert.equal(error.textContent,"Required");
  form.reset();await Promise.resolve();assert.equal(error.hidden,true);assert.equal(input.hasAttribute("aria-invalid"),false);field.destroy();
});
test("toast region announces text safely, persists, clears, and restores content", () => {
  const region=mount('<div>Original</div>'),original=region.outerHTML, toast=createToastRegion(region);
  toast.show('<script>alert(1)</script>'); assert.equal(region.querySelector("script"),null); assert.equal(region.textContent,'<script>alert(1)</script>');
  assert.equal(region.getAttribute("aria-live"),"polite"); toast.clear();assert.equal(region.textContent,"");toast.destroy();assert.equal(region.outerHTML,original);assert.throws(()=>toast.show("x"),/destroyed/);
});
test("instrument instances isolate selection, gradients, numeric bounds, and destruction", () => {
  const root=mount('<div><section><button>Original</button></section><section></section></div>'),a=root.firstChild,b=root.lastChild, original=a.innerHTML;
  const first=createInstrument(a,{motion:false}),second=createInstrument(b,{motion:false,mode:"material"});
  first.selectLayer("core");assert.equal(first.inspect().visibleLayers,1);assert.equal(second.inspect().visibleLayers,3);
  first.setSeparation(150);assert.equal(first.state.separation,100);assert.equal(first.state.renderedSeparation,60);
  first.setRotation(-45);assert.equal(first.state.rotation,315);assert.throws(()=>first.setIntensity(NaN));
  const ids=[...root.querySelectorAll("[id]")].map(node=>node.id);assert.equal(ids.length,new Set(ids).size);
  first.destroy();assert.equal(a.innerHTML,original);assert.equal(a.classList.contains("ui-instrument"),false);assert.equal(second.inspect().layers,3);second.destroy();assert.throws(()=>first.setMode("material"),/destroyed/);
});
test("theme cleanup restores inline priorities without disturbing consumer properties", () => {
  const host=mount('<div style="--ui-color-action: red !important; padding: 8px"></div>');
  const restore=applyTheme(host,{action:"#d6ef79",error:"#f29b88"});restore();assert.equal(host.style.getPropertyValue("--ui-color-action"),"red");assert.equal(host.style.getPropertyPriority("--ui-color-action"),"important");assert.equal(host.style.padding,"8px");assert.equal(host.style.getPropertyValue("--ui-color-error"),"");
});
test("default semantic text and essential boundary roles meet contrast targets", () => {
  const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  for(const background of ["foundation","surface","raised","recess"]){for(const text of ["content","secondary","action","attention","error","schematic"]){assert.ok(contrast(designTokens.color[text],designTokens.color[background])>=4.5,`${text} on ${background}`);}assert.ok(contrast(designTokens.color.boundary,designTokens.color[background])>=3,`boundary on ${background}`);}
  assert.ok(contrast(designTokens.color.recess,designTokens.color.action)>=4.5); assert.ok(contrast(designTokens.color.recess,designTokens.color.error)>=4.5);
});
test("icon rendering accepts only documented names and hides decorative markup", () => {
  assert.match(renderIcon("info"),/aria-hidden="true"/);assert.match(renderIcon("check"),/viewBox="0 0 20 20"/);assert.throws(()=>renderIcon('" onload="bad'),RangeError);
});

test("composite controls do not submit their enclosing native form", () => {
  const form=mount('<form><div><button data-ui-value="a">A</button><button data-ui-value="b">B</button></div></form>');
  let submits=0;form.addEventListener("submit",event=>{event.preventDefault();submits++;});
  const segmented=createSegmentedControl(form.firstChild);form.querySelectorAll("button")[1].click();assert.equal(submits,0);segmented.destroy();
});

test("tab focus activation and callback destruction do not leave live listeners", () => {
  const root=mount(tabsHtml);let tabs;
  tabs=createTabs(root,{onChange:()=>tabs.destroy()});
  root.querySelectorAll("button")[2].focus();assert.throws(()=>tabs.setValue("a"),/destroyed/);
});

test("popup teardown restores placement while preserving unrelated consumer styling", () => {
  const root=mount('<div><button>Actions</button><div style="top: 7px !important" hidden><button data-ui-menu-value="a">A</button></div></div>');
  const trigger=root.firstChild,popup=root.lastChild,menu=createMenu(trigger,popup);menu.show();popup.style.padding="12px";menu.destroy();
  assert.equal(popup.style.top,"7px");assert.equal(popup.style.getPropertyPriority("top"),"important");assert.equal(popup.style.padding,"12px");assert.equal(popup.style.maxWidth,"");
});

test("dialog explicitly wraps focus boundaries and skips disabled/hidden controls", () => {
  const node=mount('<dialog aria-label="Task"><input aria-label="First"><button disabled>Disabled</button><button hidden>Hidden</button><button>Last</button></dialog>');
  for(const child of node.children) child.getClientRects=()=>[{}];
  const dialog=createDialog(node);dialog.show();const first=node.firstChild,last=node.lastChild;
  last.focus();key(last,"Tab");assert.equal(document.activeElement,first);
  first.focus();first.dispatchEvent(new view.KeyboardEvent("keydown",{key:"Tab",shiftKey:true,bubbles:true,cancelable:true}));assert.equal(document.activeElement,last);dialog.destroy();
});
