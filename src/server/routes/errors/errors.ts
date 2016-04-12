import { Router, Request, Response } from 'express';

var router = Router();
var buffer: Error[] = [];

router.post('/', (req: Request, res: Response) => {
  const { error } = req.body;
  buffer = buffer.concat(error);
  res.status(400).send(`error logged at ${new Date().toISOString()}`);
});

router.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify(buffer, null, 2));
});

export = router;
