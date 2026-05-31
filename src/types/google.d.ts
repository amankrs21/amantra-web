export { };

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (options: {
                        client_id: string;
                        callback: (response: { credential?: string }) => void;
                        auto_select?: boolean;
                        cancel_on_tap_outside?: boolean;
                    }) => void;
                    renderButton: (parent: HTMLElement, options: {
                        theme?: 'outline' | 'filled_blue' | 'filled_black';
                        size?: 'small' | 'medium' | 'large';
                        text?: 'continue_with' | 'signin_with' | 'signup_with';
                        shape?: 'rectangular' | 'pill' | 'circle' | 'square';
                        width?: number;
                    }) => void;
                };
            };
        };
    }
}
