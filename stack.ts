namespace ui {
    /**
     * Axis along which a stack arranges its children.
     */
    export type UiStackOrientation = "row" | "column"

    /**
     * Options for a stack of views.
     */
    export interface UiStackOptions {
        /**
         * Axis along which children are arranged.
         */
        orientation: UiStackOrientation

        /**
         * Child views in arrangement order.
         */
        children: UiView<any>[]

        /**
         * Space between adjacent children.
         */
        gap?: number

        /**
         * Cross-axis placement of each child.
         */
        alignment?: UiLayoutAlignment
    }

    /**
     * Arranges and renders child views along one axis.
     */
    export class UiStack implements UiView<undefined> {
        public readonly layoutSpec: UiLayoutSpec
        public readonly finalRect: Rect
        public layoutDirty: boolean
        private orientation_: UiStackOrientation
        private children_: UiView<any>[]
        private gap_: number
        private alignment_: UiLayoutAlignment
        private childRect_: Rect
        private childSize_: UiMeasuredSize
        private childConstraints_: UiLayoutConstraints

        constructor(options: UiStackOptions) {
            this.orientation_ = options.orientation
            this.children_ = options.children || []
            this.gap_ = _uiControls.gap(options.gap)
            this.alignment_ = options.alignment || "start"
            this.layoutSpec = _uiControls.defaultLayoutSpec()
            this.finalRect = new Rect()
            this.layoutDirty = true
            this.childRect_ = new Rect()
            this.childSize_ = new UiMeasuredSize()
            this.childConstraints_ = { maxWidth: 0, maxHeight: 0 }
        }

        /**
         * Current child views.
         */
        public get children(): UiView<any>[] {
            return this.children_
        }

        /**
         * Replaces the child views and marks layout dirty.
         */
        public setChildren(children: UiView<any>[]): void {
            this.children_ = children || []
            this.invalidateLayout()
        }

        /**
         * Measures this stack under parent constraints.
         */
        public measure(
            constraints: UiLayoutConstraints,
            output: UiMeasuredSize,
        ): void {
            const row = this.orientation_ == "row"
            let mainSize = 0
            let crossSize = 0
            for (let i = 0; i < this.children_.length; i++) {
                this.children_[i].measure(constraints, this.childSize_)
                const main = row
                    ? this.childSize_.preferredWidth
                    : this.childSize_.preferredHeight
                const cross = row
                    ? this.childSize_.preferredHeight
                    : this.childSize_.preferredWidth
                mainSize += main
                if (cross > crossSize) crossSize = cross
            }
            if (this.children_.length > 1)
                mainSize += this.gap_ * (this.children_.length - 1)
            const width = row ? mainSize : crossSize
            const height = row ? crossSize : mainSize
            measureLayoutSpec(
                this.layoutSpec,
                constraints,
                width,
                height,
                width,
                height,
                output,
            )
            this.clearLayoutInvalidation()
        }

        /**
         * Arranges child rectangles within the assigned bounds.
         */
        public arrange(rect: Rect): void {
            copyArrangedLayoutRect(this.finalRect, rect)
            this.childConstraints_.maxWidth = this.finalRect.width
            this.childConstraints_.maxHeight = this.finalRect.height
            const row = this.orientation_ == "row"
            let pos = row ? this.finalRect.x : this.finalRect.y
            for (let i = 0; i < this.children_.length; i++) {
                const child = this.children_[i]
                child.measure(this.childConstraints_, this.childSize_)
                const childWidth = this.childSize_.preferredWidth
                const childHeight = this.childSize_.preferredHeight
                if (row) {
                    const h = _uiLayout.alignedSize(
                        this.finalRect.height,
                        childHeight,
                        this.alignment_,
                    )
                    this.childRect_.set(
                        pos,
                        _uiLayout.alignedOffset(
                            this.finalRect.y,
                            this.finalRect.height,
                            h,
                            this.alignment_,
                        ),
                        childWidth,
                        h,
                    )
                    pos += childWidth + this.gap_
                } else {
                    const w = _uiLayout.alignedSize(
                        this.finalRect.width,
                        childWidth,
                        this.alignment_,
                    )
                    this.childRect_.set(
                        _uiLayout.alignedOffset(
                            this.finalRect.x,
                            this.finalRect.width,
                            w,
                            this.alignment_,
                        ),
                        pos,
                        w,
                        childHeight,
                    )
                    pos += childHeight + this.gap_
                }
                child.arrange(this.childRect_)
            }
            this.clearLayoutInvalidation()
        }

        /**
         * Marks the stack as needing layout.
         */
        public invalidateLayout(): void {
            this.layoutDirty = true
        }

        /**
         * Clears this stack's layout invalidation flag.
         */
        public clearLayoutInvalidation(): void {
            this.layoutDirty = false
        }

        /**
         * Renders the child views.
         */
        public render(
            surface: DrawSurface,
            assets: UiAssetResolver,
            focus?: UiFocusState,
        ): void {
            for (let i = 0; i < this.children_.length; i++) {
                this.children_[i].render(surface, assets, focus)
            }
        }

        /**
         * Stacks do not consume focus input.
         */
        public handleFocusInput(result: UiFocusInputResult): undefined {
            return undefined
        }

        /**
         * Resolves resolver-backed content ids for child views.
         */
        public _resolveContentAssets(assets: UiAssetResolver): void {
            for (let i = 0; i < this.children_.length; i++) {
                const child = <any>this.children_[i]
                if (child._resolveContentAssets)
                    child._resolveContentAssets(assets)
            }
        }
    }
}
