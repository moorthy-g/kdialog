## Kdialog

A Facebook Friendly dialog, made to comply with custom CSS & JS animations. 
> "Its a piece of wet clay, you can make it awesome or awful. Choice is yours"

[View demo](http://moorthy-g.github.io/kdialog/)

### Mission
- Freedom in animation
- Ease of placement
- Minimal CSS overwriting
- Lightweight


### Features
- Custom CSS Animation/Transition
- Placement in Facebook context
- Action handlers for custom actions
- Graceful degradation for browsers that doesn't support CSS animation / Transition (android3-, IE10-)
- AMD Ready


### Setup
- Include `kdialog.jquery.min.js`
- Include `kdialog.css` or `kdialog.less`

### Usage

```html
<div id="kdialog" class="kdialog">
    your dialog contents
</div>
```

```
$("#kdialog").kdialog([options]) //initiation
```

```
$("#kdialog").kdialog(command [, options]) //initiation and/or action
```

### Properties

List of few useful properties that the instance provides.

- `element` refers dialog element.
- `isOpen` indicates current dialog status.
- `settings` an object holds current plugin options. you can view/modify options through this

> note: Callbacks & Action handlers are excecutes in instance context, which means `this` keyword inside these handlers refers the current kdialog instance


### Options
> note: Options can be modified in runtime and the changes would be immediately reflected

#### CSS ("animation" | "transition" | null)
`Default: "animation"`

whether to use css animation or transition or nothing

If `animation`, class `in` will be added to dialog as it opens & class `out` will be added to dialog as it closes. We should use these classes to bind animations

If `transition`, use class `from` to determine the intial state for transition

> Class `transition` will be added to dialog whenever it opens/closes. 
> Transition details can be controlled using this class (delay, timing-function, ect...)

> Note: Interested in dynamic transitions?? refer `transitFrom` , `transitTo` 


#### modal (boolean)
`Default: true`

You know the purpose very well :)


#### actionHandlers (object)

Action Handlers are to handle custom actions.
If you add `data-action=[actionname]` in a html element inside dialog. Its corresponding handler fires as user click on that HTML element.


##### **For Example:**
It would be helpful to handle our authentication refusal dialog. 

```javascript
actionHandlers: {
    'continue': function(){
        console.log('continuing!');
    },
    'cancel': function(){
        console.log('quit');
    }
}
```
These action handlers listens for `continue` & `cancel` actions. If a user clicks any element inside dialog with `data-action="continue"` `data-action="cancel"`, its corresponding handler fires 

> note: `data-action="close"` is having a native handler. i.e if the user clicks any element with data-action="close", it closes the dialog

> note: Execution context would be always the instance.


#### wrapperClass (string)
`Default: "kdefault"`

Adds a class to the wrapper of the dialog. 
> note: Its must, to change the default value to create your own custom theme dialog


#### position [("auto"|integer|null), ("auto"|integer|null)]
`Default: ["auto", "auto"]`

The value of position is an array with two value. First value is horizontal placement whereas second value is vertical placement. `"auto"` aligns the dialog center in visible area. `null` doesn’t include any positioning detail in inline
i.e you should use css for positioning


#### easyClose (boolean)
`Default: false`

If it set to `true`, popup closes in esc & overlay tap


#### transitFrom / transitTo (object)
It helps to create dynamic transitions for dialog. To make it work set `css: "transition"`

Object contains list of css property, value pairs. for ex:

```javascript
transitFrom: {
    opacity: 0,
    width: 0
}
transitTo: {
    opacity: 1,
	width : window.innerWidth
}
```

Dialog animates from `transitFrom` to `transitTo` as it opens
and animates from `transitTo` to `transitFrom` as it closes

> Class `transition` will be added to dialog whenever it opens/closes. 
> Transition details (delay, timing-function, ect...) can be controlled using this class.


#### beforeOpen/beforeClose/open/close

These callbacks are pretty self explainatory
To know more about when these callbacks fires in runtime see [execution flow](#execution-flow)

> note: Execution context would be always the instance


### Plugin Method Calls

Methods can be invoked using the syntax `$(element).kdialog(command [, options])`

command is a string to perform specific operation. 
Valid commands in kDialog are `"open"`, `"close"`, `"refresh"`, `"destroy"`.

If you specify any options alongwith, they will be applied while command execution.

`"open"`, `"close"`, `"destroy"` are self explanatory.

`"refresh"` command refreshes the dialog with its current settings. 
It would be helpful to reposition the dialog on window resize


### Execution Flow
This section isn't very important. But, It might help you to understand the plugin and help to do better.


##### **Execution Flow: init**
1. Adds wrapper element(`.kwrapper`) to the dialog
2. Register action handlers


##### **Execution Flow: open**
1. Runs through initiation flow (If instance not initiated before)
2. Make the dialog visible for renderer `(i.e: display:block)`
   It would be helpful to get proper width, height, offset etc..
3. Perform placement (if any)
4. Fires `beforeOpen` callback
5. Fades in overlay (if modal is true)
6. Starts open animation/transition (if any)
7. Fires `open` callback at the end of animation/transition


##### **Execution Flow: close**
1. Fires `beforeClose` callback
2. Starts close animation/transition (if any)
3. Fires `close` callback at the end of animation/transition


##### **Execution Flow: destroy**
1. Runs through close flow (If instance is open)
2. Whipe out the entire dialog from DOM
3. If no other kdialog instance in DOM, remove the overlay

```
Good luck & happy coding :)
```