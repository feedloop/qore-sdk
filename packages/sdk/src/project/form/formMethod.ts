export type FormMethod = {
  submit: (values: Record<string, any>) => Promise<void>;
};
